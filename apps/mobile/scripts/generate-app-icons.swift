import AppKit
import Foundation

let root = URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent()
    .deletingLastPathComponent()
    .deletingLastPathComponent()
    .deletingLastPathComponent()

func color(_ red: CGFloat, _ green: CGFloat, _ blue: CGFloat) -> NSColor {
    NSColor(calibratedRed: red, green: green, blue: blue, alpha: 1)
}

func drawIcon(size: Int) -> Data {
    let dimension = CGFloat(size)
    guard let bitmap = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: size,
        pixelsHigh: size,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    ), let graphics = NSGraphicsContext(bitmapImageRep: bitmap) else {
        fatalError("Could not create app icon canvas at \(size)x\(size)")
    }
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = graphics
    graphics.imageInterpolation = .high
    defer { NSGraphicsContext.restoreGraphicsState() }

    color(0.086, 0.478, 0.290).setFill()
    NSBezierPath(rect: NSRect(x: 0, y: 0, width: dimension, height: dimension)).fill()

    let scale = dimension / 1024
    func point(_ x: CGFloat, _ y: CGFloat) -> NSPoint {
        NSPoint(x: x * scale, y: y * scale)
    }

    let center = point(512, 512)
    color(0.91, 0.97, 0.93).setFill()
    NSBezierPath(ovalIn: NSRect(
        x: center.x - 390 * scale,
        y: center.y - 390 * scale,
        width: 780 * scale,
        height: 780 * scale
    )).fill()

    color(0.086, 0.478, 0.290).setStroke()
    let monogram = NSBezierPath()
    monogram.lineWidth = 92 * scale
    monogram.lineCapStyle = .round
    monogram.lineJoinStyle = .round
    monogram.move(to: point(278, 356))
    monogram.line(to: point(278, 668))
    monogram.line(to: point(512, 476))
    monogram.line(to: point(746, 668))
    monogram.line(to: point(746, 356))
    monogram.stroke()

    color(0.96, 0.76, 0.34).setFill()
    NSBezierPath(ovalIn: NSRect(
        x: center.x - 78 * scale,
        y: center.y - 78 * scale,
        width: 156 * scale,
        height: 156 * scale
    )).fill()
    color(0.086, 0.478, 0.290).setFill()
    NSBezierPath(ovalIn: NSRect(
        x: center.x - 26 * scale,
        y: center.y - 26 * scale,
        width: 52 * scale,
        height: 52 * scale
    )).fill()

    guard let png = bitmap.representation(using: .png, properties: [:]) else {
        fatalError("Could not encode app icon at \(size)x\(size)")
    }
    return png
}

func writeIcon(_ name: String, size: Int, to directory: URL) throws {
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    try drawIcon(size: size).write(to: directory.appendingPathComponent(name))
}

let iosDirectory = root.appendingPathComponent("apps/mobile/ios/mobile/Images.xcassets/AppIcon.appiconset")
let iosIcons: [(String, Int)] = [
    ("AppIcon-20@2x.png", 40),
    ("AppIcon-20@3x.png", 60),
    ("AppIcon-29@2x.png", 58),
    ("AppIcon-29@3x.png", 87),
    ("AppIcon-40@2x.png", 80),
    ("AppIcon-40@3x.png", 120),
    ("AppIcon-60@2x.png", 120),
    ("AppIcon-60@3x.png", 180),
    ("AppIcon-1024.png", 1024),
]
for (name, size) in iosIcons {
    try writeIcon(name, size: size, to: iosDirectory)
}

let androidResources = root.appendingPathComponent("apps/mobile/android/app/src/main/res")
let androidIcons = [
    ("mipmap-mdpi", 48),
    ("mipmap-hdpi", 72),
    ("mipmap-xhdpi", 96),
    ("mipmap-xxhdpi", 144),
    ("mipmap-xxxhdpi", 192),
]
for (directory, size) in androidIcons {
    let destination = androidResources.appendingPathComponent(directory)
    try writeIcon("ic_launcher.png", size: size, to: destination)
    try writeIcon("ic_launcher_round.png", size: size, to: destination)
}
