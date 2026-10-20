import CoreMediaIO
import Foundation

struct Activity: Encodable {
    let cameraInUse: Bool
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

let activity = Activity(cameraInUse: isCameraInUse())

let data = try JSONEncoder().encode(activity)
FileHandle.standardOutput.write(data)
