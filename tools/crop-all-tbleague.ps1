<#
  Drives crop-sheet.ps1 across every TBLeague chart.
  Model numbers and per-row height notations were read off each sheet at full
  resolution and verified; see images/CREDITS.md for provenance.
#>
param([string]$SourceDir = "C:\Users\noghr\Downloads")

$script = Join-Path $PSScriptRoot "crop-sheet.ps1"
$outDir = Join-Path (Split-Path $PSScriptRoot -Parent) "images\tbleague"

$sheets = @(
  @{ F="53418826025_076939bfda_o"; N=@("S01A","S02A","S01B","S02B","S04B","S06B","S04C","S06C","S07C","S09C","S07D","S09D") },
  @{ F="53418391701_dc0ca92b3e_o"; N=@("S10D","S12D","S10E","S12E","S16A","S17B","S16B","S17C","S18A","S19B","S18B","S19C") },
  @{ F="53418715114_c34cbb52a7_o"; N=@("S20A","S21B","S20B","S21C","S22A","S23B","S22B","S23C","S24A","S25B","S24B","S25C") },
  @{ F="53418715119_8e960c039d_o"; N=@("S26A","S27B","S26B","S27C","S28A","S29B","S28B","S29C","S32A","S33B","S32B","S33C") },
  @{ F="53418715109_9b9cdfeab8_o"; N=@("S34A","S35A","S34B","S35B","S36A","S36B","S36C","S36D","S38A","S39A","S38B","S39B") },
  @{ F="53418715094_6fc0264a2b_o"; N=@("S40A","S40B","S40C","S40D","S41A","S41B","S41C","S41D","S42A","S43A","S42B","S43B") },
  @{ F="53417473612_ea26a1d987_o"; N=@("S44A","S45A","S44B","S45B","S46A","S47A","S46C","S47C","S46B","S47B","S46D","S47D") },
  @{ F="53417473607_13cef8082f_o"; N=@("S48A","S49A","S48B","S49B","S50A","S51A","S50C","S50D","S50B","S51B","S51C","S51D") }
)

foreach ($s in $sheets) {
  Write-Output "`n=== $($s.F) ==="
  & $script -In (Join-Path $SourceDir "$($s.F).png") -OutDir $outDir -Prefix "tbleague" -Names $s.N
}

# wide single-row layout needs different scan bounds
Write-Output "`n=== 53418391666_81e7a39178_o (wide layout) ==="
& $script -In (Join-Path $SourceDir "53418391666_81e7a39178_o.png") -OutDir $outDir -Prefix "tbleague" `
    -Names @("S52A","S53A","S52B","S53B") -ScanLeft 400 -ScanRight 2600 -ScanTop 320 -ScanBottom 1500 -MinBandH 600
