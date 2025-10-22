import UIKit
import Expo
import ExpoModulesCore
import ReactAppDependencyProvider
import EXUpdates

// Custom delegate for React Native factory with expo-updates support
class CustomReactNativeFactoryDelegate: ExpoReactNativeFactoryDelegate {
  override func bundleURL() -> URL? {
    #if DEBUG
    // In development, check if expo-updates controller has a bundle URL
    if let updatesUrl = AppDelegate.shared().updatesController?.launchAssetUrl() {
      return updatesUrl
    }
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    // In production, always use expo-updates bundle URL
    if let updatesUrl = AppDelegate.shared().updatesController?.launchAssetUrl() {
      return updatesUrl
    }
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
  
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return bridge.bundleURL ?? bundleURL()
  }
}

@objc(AppDelegate)
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?
  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  var updatesController: (any InternalAppControllerInterface)?
  
  static func shared() -> AppDelegate {
    guard let delegate = UIApplication.shared.delegate as? AppDelegate else {
      fatalError("Could not get app delegate")
    }
    return delegate
  }
  
  // Initialize React Native factory with RCTAppDependencyProvider for third-party Fabric components
  private func initializeReactNativeAndUpdates(_ launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
    self.launchOptions = launchOptions
    let delegate = CustomReactNativeFactoryDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    
    // CRITICAL: Set RCTAppDependencyProvider to register third-party Fabric components
    delegate.dependencyProvider = RCTAppDependencyProvider()
    
    // Bind factory to ExpoAppDelegate so expo-updates can use it
    bindReactNativeFactory(factory)
    
    // Initialize expo-updates controller (must be called before starting)
    AppController.initializeWithoutStarting()
  }
  
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Initialize React Native and expo-updates
    initializeReactNativeAndUpdates(launchOptions)
    
    // Call super to notify Expo subscribers
    _ = super.application(application, didFinishLaunchingWithOptions: launchOptions)
    
    // Create window with custom view controller
    self.window = UIWindow(frame: UIScreen.main.bounds)
    let controller = CustomViewController()
    self.window?.rootViewController = controller
    window?.makeKeyAndVisible()
    
    return true
  }
}

/**
 Custom view controller that handles expo-updates initialization and creates the React Native view
 */
class CustomViewController: UIViewController, AppControllerDelegate {
  let appDelegate = AppDelegate.shared()
  
  convenience init() {
    self.init(nibName: nil, bundle: nil)
    self.view.backgroundColor = .white
    
    #if DEBUG
    // In development, create view immediately (no updates check)
    createView()
    #else
    // In production, start expo-updates and wait for completion
    appDelegate.updatesController = AppController.sharedInstance
    AppController.sharedInstance.delegate = self
    AppController.sharedInstance.start()
    #endif
  }
  
  required override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: Bundle?) {
    super.init(nibName: nibNameOrNil, bundle: nibBundleOrNil)
  }
  
  @available(*, unavailable)
  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  // expo-updates completion handler
  func appController(
    _ appController: AppControllerInterface,
    didStartWithSuccess success: Bool
  ) {
    createView()
  }
  
  private func createView() {
    guard let factory = appDelegate.factory else {
      fatalError("React Native factory not initialized")
    }
    
    let rootView = factory.rootViewFactory.view(
      withModuleName: "ChayoMobile",
      initialProperties: [:],
      launchOptions: appDelegate.launchOptions
    )
    
    rootView.translatesAutoresizingMaskIntoConstraints = false
    self.view.addSubview(rootView)
    
    NSLayoutConstraint.activate([
      rootView.topAnchor.constraint(equalTo: self.view.topAnchor),
      rootView.bottomAnchor.constraint(equalTo: self.view.bottomAnchor),
      rootView.leadingAnchor.constraint(equalTo: self.view.leadingAnchor),
      rootView.trailingAnchor.constraint(equalTo: self.view.trailingAnchor)
    ])
  }
}
