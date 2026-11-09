Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Ramiro Lacci\.gemini\antigravity\brain\64b9c810-5694-4ae8-8875-8430673c5ea4\airpresenter_app_icon_1794237579756.jpg"
$rawImage = [System.Drawing.Bitmap]::FromFile($srcPath)

$w = $rawImage.Width
$h = $rawImage.Height
Write-Host "Source image size: $w x $h"

# Cropping the central squircle (eliminates outer black padding, roughly 12% margin on each side)
# 1024 * 0.12 = ~123px, squircle width = ~778px
$cropX = [int]($w * 0.12)
$cropY = [int]($h * 0.12)
$cropW = [int]($w * 0.76)
$cropH = [int]($h * 0.76)

$cropRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropW, $cropH
$croppedBmp = $rawImage.Clone($cropRect, $rawImage.PixelFormat)

function Save-Resized($src, $targetW, $targetH, $destPath) {
    $destBmp = New-Object System.Drawing.Bitmap $targetW, $targetH
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($src, 0, 0, $targetW, $targetH)
    $g.Dispose()

    if (Test-Path $destPath) {
        Remove-Item $destPath -Force
    }
    $destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Host "Saved: $destPath ($targetW x $targetH)"
}

Save-Resized $croppedBmp 512 512 "public/icons/icon-raw.png"
Save-Resized $croppedBmp 128 128 "public/icons/icon128.png"
Save-Resized $croppedBmp 48 48 "public/icons/icon48.png"
Save-Resized $croppedBmp 16 16 "public/icons/icon16.png"

$croppedBmp.Dispose()
$rawImage.Dispose()
Write-Host "Icon generation complete!"
