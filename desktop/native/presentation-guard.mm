#import <AppKit/AppKit.h>
#include <node_api.h>
#include <cstring>

static bool enabled = false;
static NSApplicationPresentationOptions originalOptions;

static napi_value SetEnabled(napi_env env, napi_callback_info info) {
  size_t count = 1;
  napi_value argument;
  bool requested;
  if (napi_get_cb_info(env, info, &count, &argument, nullptr, nullptr) != napi_ok ||
      count != 1 || napi_get_value_bool(env, argument, &requested) != napi_ok) {
    napi_throw_type_error(env, nullptr, "Expected one boolean");
    return nullptr;
  }
  if (![NSThread isMainThread] || NSApp == nil) {
    napi_throw_error(env, nullptr, "Presentation guard requires the ready Electron main thread");
    return nullptr;
  }
  @try {
    if (requested && !enabled) {
      originalOptions = [NSApp presentationOptions];
      // Keep system escape routes and hardware controls. Do not use Electron's
      // kiosk preset, which also disables force quit and session termination.
      [NSApp setPresentationOptions:
          NSApplicationPresentationHideDock |
          NSApplicationPresentationHideMenuBar |
          NSApplicationPresentationDisableProcessSwitching |
          NSApplicationPresentationDisableHideApplication];
      enabled = true;
    } else if (!requested && enabled) {
      [NSApp setPresentationOptions:originalOptions];
      enabled = false;
    }
  } @catch (NSException *exception) {
    napi_throw_error(env, nullptr, [[exception reason] UTF8String]);
    return nullptr;
  }
  napi_value result;
  napi_get_undefined(env, &result);
  return result;
}

static napi_value GetOptions(napi_env env, napi_callback_info info) {
  napi_value result;
  napi_create_uint32(env, (uint32_t)[NSApp presentationOptions], &result);
  return result;
}

// Electron supplies an NSView* buffer in the main process. Call only with a
// live BrowserWindow handle; never accept handles from a renderer or disk.
static napi_value GetWindowState(napi_env env, napi_callback_info info) {
  size_t count = 1, length = 0;
  napi_value argument;
  void *bytes = nullptr;
  bool isBuffer = false;
  if (napi_get_cb_info(env, info, &count, &argument, nullptr, nullptr) != napi_ok ||
      count != 1 || napi_is_buffer(env, argument, &isBuffer) != napi_ok || !isBuffer ||
      napi_get_buffer_info(env, argument, &bytes, &length) != napi_ok || length != sizeof(void *)) {
    napi_throw_type_error(env, nullptr, "Expected a live BrowserWindow native handle");
    return nullptr;
  }
  if (![NSThread isMainThread] || NSApp == nil) {
    napi_throw_error(env, nullptr, "Window state requires the ready Electron main thread");
    return nullptr;
  }
  void *pointer = nullptr;
  std::memcpy(&pointer, bytes, sizeof(pointer));
  NSWindow *window = [(__bridge NSView *)pointer window];
  const bool foreground = [NSApp isActive] &&
      [[[NSWorkspace sharedWorkspace] frontmostApplication] processIdentifier] ==
          [[NSProcessInfo processInfo] processIdentifier];
  const bool visible = [window isVisible] &&
      ([window occlusionState] & NSWindowOcclusionStateVisible) != 0;
  napi_value result, value;
  napi_create_object(env, &result);
  napi_get_boolean(env, foreground, &value);
  napi_set_named_property(env, result, "foreground", value);
  napi_get_boolean(env, visible, &value);
  napi_set_named_property(env, result, "visible", value);
  napi_get_boolean(env, [window isKeyWindow], &value);
  napi_set_named_property(env, result, "focused", value);
  return result;
}

NAPI_MODULE_INIT() {
  napi_value setter, getter, windowState;
  napi_create_function(env, "setEnabled", NAPI_AUTO_LENGTH, SetEnabled, nullptr, &setter);
  napi_create_function(env, "getOptions", NAPI_AUTO_LENGTH, GetOptions, nullptr, &getter);
  napi_set_named_property(env, exports, "setEnabled", setter);
  napi_set_named_property(env, exports, "getOptions", getter);
  napi_create_function(env, "getWindowState", NAPI_AUTO_LENGTH, GetWindowState, nullptr, &windowState);
  napi_set_named_property(env, exports, "getWindowState", windowState);
  return exports;
}
