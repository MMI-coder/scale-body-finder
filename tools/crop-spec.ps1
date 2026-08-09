<#
  crop-spec.ps1 - pull a clean body shot out of a manufacturer spec image.

  Unlike crop-sheet.ps1 (which handles regular grids), these images are one-offs:
  a body surrounded by dimension arrows, callout text and accessory parts. So the
  caller gives a rough search region, and this tightens onto the body inside it.

  Thin dimension arrows and dotted measurement lines are rejected by erosion: a
  column only counts as body if its neighbours within +/-$Erode also have content.
  A 2px arrow fails that test; a leg passes it.

  -Mode white : light background (TBLeague spec sheets)
  -Mode black : dark background (VeryCool spec sheets)
  -Mode rect  : no detection, crop the search region verbatim (gradient backdrops)
#>
param(
  [Parameter(Mandatory)][string]$In,
  [Parameter(Mandatory)][string]$Out,
  [Parameter(Mandatory)][int]$X0,
  [Parameter(Mandatory)][int]$Y0,
  [Parameter(Mandatory)][int]$X1,
  [Parameter(Mandatory)][int]$Y1,
  [ValidateSet('white','black','rect')][string]$Mode = 'white',
  [int]$Pad = 14,
  [int]$Erode = 3,
  [int]$MinCount = 8
)

Add-Type -AssemblyName System.Drawing
$src  = New-Object System.Drawing.Bitmap($In)
$X1 = [math]::Min($X1,$src.Width); $Y1 = [math]::Min($Y1,$src.Height)

if ($Mode -eq 'rect') {
  $sx=$X0; $sy=$Y0; $w=$X1-$X0; $h=$Y1-$Y0
} else {
  $rect = New-Object System.Drawing.Rectangle(0,0,$src.Width,$src.Height)
  $d = $src.LockBits($rect,[System.Drawing.Imaging.ImageLockMode]::ReadOnly,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $px = New-Object byte[] ($d.Stride*$src.Height)
  [System.Runtime.InteropServices.Marshal]::Copy($d.Scan0,$px,0,$px.Length)
  $src.UnlockBits($d); $stride = $d.Stride

  $isBody = {
    param($x,$y)
    $i = $y*$stride + $x*4; $b=$px[$i]; $g=$px[$i+1]; $r=$px[$i+2]
    if ($Mode -eq 'white') { return -not ($r -gt 238 -and $g -gt 238 -and $b -gt 238) }
    return -not ($r -lt 45 -and $g -lt 45 -and $b -lt 45)
  }

  # column and row profiles over the search region
  $colN = @{}; $rowN = @{}
  for ($x=$X0; $x -lt $X1; $x++) {
    $c=0; for ($y=$Y0; $y -lt $Y1; $y+=2) { if (& $isBody $x $y) { $c++ } }; $colN[$x]=$c
  }
  for ($y=$Y0; $y -lt $Y1; $y++) {
    $c=0; for ($x=$X0; $x -lt $X1; $x+=2) { if (& $isBody $x $y) { $c++ } }; $rowN[$y]=$c
  }

  # erode: keep only positions whose whole neighbourhood is above threshold
  function Solid-Range($map,$lo,$hi,$thr,$er) {
    $first=-1; $last=-1
    for ($p=$lo+$er; $p -lt $hi-$er; $p++) {
      $ok=$true
      for ($k=-$er; $k -le $er; $k++) { if ($map[$p+$k] -lt $thr) { $ok=$false; break } }
      if ($ok) { if ($first -lt 0) { $first=$p }; $last=$p }
    }
    return ,@($first,$last)
  }
  $cr = Solid-Range $colN $X0 $X1 $MinCount $Erode
  $rr = Solid-Range $rowN $Y0 $Y1 $MinCount $Erode
  if ($cr[0] -lt 0 -or $rr[0] -lt 0) { Write-Warning "no body found in $In"; $src.Dispose(); exit 1 }

  $sx=[math]::Max(0,$cr[0]-$Pad); $sy=[math]::Max(0,$rr[0]-$Pad)
  $w =[math]::Min($src.Width-$sx, ($cr[1]-$cr[0])+2*$Pad)
  $h =[math]::Min($src.Height-$sy,($rr[1]-$rr[0])+2*$Pad)
}

$outDir = Split-Path $Out -Parent
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
$bmp = New-Object System.Drawing.Bitmap($w,$h)
$g2 = [System.Drawing.Graphics]::FromImage($bmp)
$g2.DrawImage($src,(New-Object System.Drawing.Rectangle(0,0,$w,$h)),(New-Object System.Drawing.Rectangle($sx,$sy,$w,$h)),[System.Drawing.GraphicsUnit]::Pixel)
$g2.Dispose(); $bmp.Save($Out,[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose(); $src.Dispose()
Write-Output ("{0,-26} crop=({1},{2}) {3}x{4}" -f (Split-Path $Out -Leaf),$sx,$sy,$w,$h)
