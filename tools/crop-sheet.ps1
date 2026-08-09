<#
  crop-sheet.ps1 - split a manufacturer body chart into one image per body.

  Auto-detects the grid from the white background, then crops each body to its own
  tight bounding box plus a little padding, so every body gets the full pixel budget
  and the cleanest possible visual. Aspect ratio therefore varies between bodies --
  display with object-fit: contain.

  The row reference line (the dotted height line) is excluded by starting each crop
  just below it; that line marks the top of the neck peg, so nothing of the body is lost.

  Example:
    .\crop-sheet.ps1 -In "sheet.png" -OutDir "..\images\tbleague" -Prefix "tbleague" `
        -Names S01A,S02A,S01B,S02B,S04B,S06B,S04C,S06C,S07C,S09C,S07D,S09D
#>
param(
  [Parameter(Mandatory)][string]$In,
  [Parameter(Mandatory)][string]$OutDir,
  [Parameter(Mandatory)][string[]]$Names,   # row-major, left to right
  [string]$Prefix = "",
  [int]$ScanLeft = 1100, [int]$ScanRight = 2240,   # exclude the ruler strip
  [int]$ScanTop = 60,    [int]$ScanBottom = 2020,  # exclude footer/logo
  [int]$MinBandH = 300,                            # ignore label/footer bands
  [int]$PadX = 12, [int]$PadTop = 0, [int]$PadBottom = 10,
  [switch]$WhatIf
)

Add-Type -AssemblyName System.Drawing
$src  = New-Object System.Drawing.Bitmap($In)
$rect = New-Object System.Drawing.Rectangle(0,0,$src.Width,$src.Height)
$d    = $src.LockBits($rect,[System.Drawing.Imaging.ImageLockMode]::ReadOnly,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$px   = New-Object byte[] ($d.Stride*$src.Height)
[System.Runtime.InteropServices.Marshal]::Copy($d.Scan0,$px,0,$px.Length)
$src.UnlockBits($d)
$stride = $d.Stride

# content = neither near-white (sheet) nor near-black (outer padding)
function Test-Content([int]$x,[int]$y) {
  $i = $y*$stride + $x*4; $b=$px[$i]; $g=$px[$i+1]; $r=$px[$i+2]
  if ($r -gt 244 -and $g -gt 244 -and $b -gt 244) { return $false }
  if ($r -lt 20  -and $g -lt 20  -and $b -lt 20 ) { return $false }
  return $true
}

# --- horizontal bands (one per row of bodies) ---
$bands = @(); $inBand = $false; $start = 0
for ($y = $ScanTop; $y -lt $ScanBottom; $y += 2) {
  $c = 0
  for ($x = $ScanLeft; $x -lt $ScanRight; $x += 3) { if (Test-Content $x $y) { $c++ } }
  if ($c -gt 3 -and -not $inBand) { $inBand = $true; $start = $y }
  elseif ($c -le 3 -and $inBand)  { $inBand = $false; if (($y-$start) -ge $MinBandH) { $bands += ,@($start,$y) } }
}
if ($inBand -and ($ScanBottom-$start) -ge $MinBandH) { $bands += ,@($start,$ScanBottom) }

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Force -Path $OutDir | Out-Null }
$n = 0
foreach ($b in $bands) {
  $by0 = $b[0]+10; $by1 = $b[1]      # skip the dotted reference line when finding columns
  $cols = @(); $inCol = $false; $cs = 0
  for ($x = $ScanLeft; $x -lt $ScanRight; $x++) {
    $c = 0
    for ($y = $by0; $y -lt $by1; $y += 3) { if (Test-Content $x $y) { $c++ } }
    if ($c -gt 1 -and -not $inCol) { $inCol = $true; $cs = $x }
    elseif ($c -le 1 -and $inCol)  { $inCol = $false; if (($x-$cs) -gt 30) { $cols += ,@($cs,$x) } }
  }

  foreach ($col in $cols) {
    if ($n -ge $Names.Count) { Write-Warning "more bodies found than names given"; break }
    $name = $Names[$n]; $n++

    # tight vertical extent within this column
    $top = -1; $bottom = -1
    for ($y = $b[0]+8; $y -lt $by1; $y++) {   # +8 clears the dotted reference line
      $hit = $false
      for ($x = $col[0]; $x -lt $col[1]; $x += 2) { if (Test-Content $x $y) { $hit = $true; break } }
      if ($hit) { if ($top -lt 0) { $top = $y }; $bottom = $y }
    }
    if ($top -lt 0) { Write-Warning "no content for $name"; continue }

    $sx = [math]::Max(0, $col[0]-$PadX)
    $sy = [math]::Max(0, $top-$PadTop)
    $w  = [math]::Min($src.Width-$sx,  ($col[1]-$col[0])+2*$PadX)
    $h  = [math]::Min($src.Height-$sy, ($bottom-$top)+$PadTop+$PadBottom)

    if ($Prefix) { $stem = "$Prefix-$name" } else { $stem = $name }
    $file = $stem.ToLower() + ".png"
    $path = Join-Path $OutDir $file
    Write-Output ("{0,-6} crop=({1},{2}) {3}x{4}  -> {5}" -f $name,$sx,$sy,$w,$h,$file)
    if ($WhatIf) { continue }

    $bmp = New-Object System.Drawing.Bitmap($w,$h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($src,
      (New-Object System.Drawing.Rectangle(0,0,$w,$h)),
      (New-Object System.Drawing.Rectangle($sx,$sy,$w,$h)),
      [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose(); $bmp.Save($path,[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
  }
}
$src.Dispose()
Write-Output "$n crops written to $OutDir"
