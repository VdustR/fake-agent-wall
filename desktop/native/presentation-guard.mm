#import <AppKit/AppKit.h>
#include <node_api.h>

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

NAPI_MODULE_INIT() {
  napi_value setter, getter;
  napi_create_function(env, "setEnabled", NAPI_AUTO_LENGTH, SetEnabled, nullptr, &setter);
  napi_create_function(env, "getOptions", NAPI_AUTO_LENGTH, GetOptions, nullptr, &getter);
  napi_set_named_property(env, exports, "setEnabled", setter);
  napi_set_named_property(env, exports, "getOptions", getter);
  return exports;
}
