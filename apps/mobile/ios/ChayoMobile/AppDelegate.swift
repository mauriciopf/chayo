import UIKit
import Expo
import ExpoModulesCore
import ReactAppDependencyProvider

// Custom delegate for React Native factory
class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func bundleURL() -> URL? {
    #if DEBUG
    // Standard React Native Metro entry point
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
  
  override func turboModuleEnabled() -> Bool { true }
  override func fabricEnabled() -> Bool { true }
}

@objc(AppDelegate)
class AppDelegate: UIResponder, UIApplicationDelegate, ReactNativeFactoryProvider {
  var window: UIWindow?
  var factory: RCTReactNativeFactory?
  
  // Expo delegate with registered handlers (including expo-updates)
  private lazy var expoReactDelegate: ExpoReactDelegate = {
    let modulesProvider = ExpoModulesProvider()
    let handlers = modulesProvider.getReactDelegateHandlers().map { $0.handler.init() }
    return ExpoReactDelegate(handlers: handlers)
  }()
  
  // Create the factory with custom delegate
  private lazy var reactFactory: RCTReactNativeFactory = {
    let delegate = ReactNativeDelegate()
    delegate.dependencyProvider = RCTAppDependencyProvider()
    let factory = RCTReactNativeFactory(delegate: delegate)
    self.factory = factory
    return factory
  }()
  
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Initialize factory first
    _ = reactFactory
    
    // Notify Expo subscribers
    ExpoAppDelegateSubscriberRepository.subscribers.forEach { subscriber in
      _ = subscriber.application?(application, didFinishLaunchingWithOptions: launchOptions)
    }
    
    // Create window
    let window = UIWindow(frame: UIScreen.main.bounds)
    
    // Let ExpoReactDelegate create the root view (this calls ExpoUpdatesReactDelegateHandler)
    let rootView = expoReactDelegate.createReactRootView(
      moduleName: "ChayoMobile",
      initialProperties: [:],
      launchOptions: launchOptions
    )
    
    let viewController = UIViewController()
    viewController.view = rootView
    window.rootViewController = viewController
    window.makeKeyAndVisible()
    self.window = window
    
    return true
  }
  
  func recreateRootView(
    withBundleURL: URL?,
    moduleName: String?,
    initialProps: [AnyHashable: Any]?,
    launchOptions: [AnyHashable: Any]?
  ) -> UIView {
    guard let factory = self.factory else {
      fatalError("Factory not initialized")
    }
    return factory.rootViewFactory.view(
      withModuleName: moduleName ?? "ChayoMobile",
      initialProperties: initialProps,
      launchOptions: launchOptions
    )
  }
}
