import AppKit
import CoreAudio
import CoreGraphics
import CoreMediaIO
import Foundation

struct Activity: Encodable {
    let audioPlaying: Bool
    let cameraInUse: Bool
    let fullScreen: Bool
}

func readUInt32(_ objectID: AudioObjectID, _ address: inout AudioObjectPropertyAddress) -> UInt32? {
    var value: UInt32 = 0
    var size = UInt32(MemoryLayout<UInt32>.size)
    guard AudioObjectHasProperty(objectID, &address),
          AudioObjectGetPropertyData(objectID, &address, 0, nil, &size, &value) == noErr else {
        return nil
    }
    return value
}

func isAudioPlaying() -> Bool {
    var defaultOutputAddress = AudioObjectPropertyAddress(
        mSelector: kAudioHardwarePropertyDefaultOutputDevice,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    var device = AudioDeviceID(0)
    var size = UInt32(MemoryLayout<AudioDeviceID>.size)
    guard AudioObjectGetPropertyData(
        AudioObjectID(kAudioObjectSystemObject),
        &defaultOutputAddress,
        0,
        nil,
        &size,
        &device
    ) == noErr else { return false }

    var runningAddress = AudioObjectPropertyAddress(
        mSelector: kAudioDevicePropertyDeviceIsRunningSomewhere,
        mScope: kAudioDevicePropertyScopeOutput,
        mElement: kAudioObjectPropertyElementMain
    )
    return readUInt32(device, &runningAddress) == 1
}

func isCameraInUse() -> Bool {
    var devicesAddress = CMIOObjectPropertyAddress(
        mSelector: CMIOObjectPropertySelector(kCMIOHardwarePropertyDevices),
        mScope: CMIOObjectPropertyScope(kCMIOObjectPropertyScopeGlobal),
        mElement: CMIOObjectPropertyElement(kCMIOObjectPropertyElementMain)
    )
    var size: UInt32 = 0
    guard CMIOObjectGetPropertyDataSize(
        CMIOObjectID(kCMIOObjectSystemObject),
        &devicesAddress,
        0,
        nil,
        &size
    ) == noErr else { return false }

    let count = Int(size) / MemoryLayout<CMIODeviceID>.size
    var devices = Array(repeating: CMIODeviceID(0), count: count)
    var dataUsed: UInt32 = 0
    guard CMIOObjectGetPropertyData(
        CMIOObjectID(kCMIOObjectSystemObject),
        &devicesAddress,
        0,
        nil,
        size,
        &dataUsed,
        &devices
    ) == noErr else { return false }

    for device in devices {
        var runningAddress = CMIOObjectPropertyAddress(
            mSelector: CMIOObjectPropertySelector(kCMIODevicePropertyDeviceIsRunningSomewhere),
            mScope: CMIOObjectPropertyScope(kCMIOObjectPropertyScopeGlobal),
            mElement: CMIOObjectPropertyElement(kCMIOObjectPropertyElementMain)
        )
        var running: UInt32 = 0
        let runningSize = UInt32(MemoryLayout<UInt32>.size)
        var runningDataUsed: UInt32 = 0
        if CMIOObjectHasProperty(device, &runningAddress),
           CMIOObjectGetPropertyData(device, &runningAddress, 0, nil, runningSize, &runningDataUsed, &running) == noErr,
           running == 1 {
            return true
        }
    }
    return false
}

func nearlyEqual(_ lhs: CGFloat, _ rhs: CGFloat) -> Bool {
    abs(lhs - rhs) <= 2
}

func isFrontmostAppFullScreen() -> Bool {
    guard let pid = NSWorkspace.shared.frontmostApplication?.processIdentifier,
          let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID)
            as? [[CFString: Any]] else { return false }

    let screenBounds = NSScreen.screens.compactMap { screen -> CGRect? in
        guard let number = screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? NSNumber else {
            return nil
        }
        return CGDisplayBounds(CGDirectDisplayID(number.uint32Value))
    }
    for window in windows {
        guard (window[kCGWindowOwnerPID] as? NSNumber)?.int32Value == pid,
              let rawBounds = window[kCGWindowBounds] as? NSDictionary,
              let bounds = CGRect(dictionaryRepresentation: rawBounds) else { continue }

        // Full-screen windows can live above the normal layer. Electron's
        // simple full-screen + screen-saver level combination is one example.
        // The frontmost owner and exact display bounds identify the window;
        // requiring layer 0 would reject otherwise valid full-screen apps.
        if screenBounds.contains(where: {
            nearlyEqual(bounds.minX, $0.minX) &&
            nearlyEqual(bounds.minY, $0.minY) &&
            nearlyEqual(bounds.width, $0.width) &&
            nearlyEqual(bounds.height, $0.height)
        }) {
            return true
        }
    }
    return false
}

let activity = Activity(
    audioPlaying: isAudioPlaying(),
    cameraInUse: isCameraInUse(),
    fullScreen: isFrontmostAppFullScreen()
)

let data = try JSONEncoder().encode(activity)
FileHandle.standardOutput.write(data)
