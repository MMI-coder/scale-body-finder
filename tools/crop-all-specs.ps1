<#
  Drives crop-spec.ps1 across the one-off manufacturer spec images.
  Search regions are hand-set to isolate the front-facing body from callout text,
  dimension arrows and accessory parts; crop-spec.ps1 then tightens onto the body.
#>
param([string]$SourceDir = "C:\Users\noghr\Pictures\Collections")

$script = Join-Path $PSScriptRoot "crop-spec.ps1"
$img    = Join-Path (Split-Path $PSScriptRoot -Parent) "images"

$jobs = @(
  # TBLeague spec sheets - white backdrop, front figure is the left one
  @{ S="TBLeague SR-AD01.jpg"; O="tbleague\tbleague-sr-ad01.png"; R=@(80,210,350,1470);  M="white" },
  @{ S="TBLeague SR-BD01.jpg"; O="tbleague\tbleague-sr-bd01.png"; R=@(128,180,422,1310); M="white" },
  @{ S="TBLeague SR-CD01.jpg"; O="tbleague\tbleague-sr-cd01.png"; R=@(155,180,425,1300); M="white" },
  @{ S="TBLeague SR-DD01.jpg"; O="tbleague\tbleague-sr-dd01.png"; R=@(155,180,430,1300); M="white" },
  @{ S="TBLeague TB-DF01.jpg"; O="tbleague\tbleague-tb-df01.png"; R=@(75,280,335,1480);  M="white" },

  # VeryCool spec sheets - black backdrop, callout text sits to the right.
  # Regions measured off the actual body extents so the title/logo stay outside.
  @{ S="VeryCool VCD-01.jpg";       O="verycool\verycool-vcd-01.png"; R=@(150,75,500,1670);  M="black" },
  @{ S="VeryCool VCD-02.jpg";       O="verycool\verycool-vcd-02.png"; R=@(155,70,490,1660);  M="black" },
  @{ S="VeryCool VCD-03.jpg";       O="verycool\verycool-vcd-03.png"; R=@(150,70,532,1705);  M="black" },
  # VCD-05's main sheet shows the back; the "extra" shot is the front view
  @{ S="VeryCool VCD-05 extra.jpg"; O="verycool\verycool-vcd-05.png"; R=@(300,180,870,1620); M="black" },

  # Gradient backdrops - detection can't separate a grey ground from silver hair or
  # white swimwear, so these are cropped to a hand-set rectangle.
  @{ S="N-1A.jpg";                 O="novan\novan-n-1a.png";        R=@(190,115,652,1568); M="rect" },
  # VCD-06 and VCD-07 are the same body (feet attached vs removable), so they share this
  # shot. Top starts below the title bar, which costs the neck peg ball.
  @{ S="VeryCoolVCD-06 extra.jpg"; O="verycool\verycool-vcd-06.png"; R=@(300,125,850,1608); M="rect" },
  @{ S="VeryCoolVCD-06 extra.jpg"; O="verycool\verycool-vcd-07.png"; R=@(300,125,850,1608); M="rect" }
)

foreach ($j in $jobs) {
  & $script -In (Join-Path $SourceDir $j.S) -Out (Join-Path $img $j.O) `
            -X0 $j.R[0] -Y0 $j.R[1] -X1 $j.R[2] -Y1 $j.R[3] -Mode $j.M
}
