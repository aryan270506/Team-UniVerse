import { registerWebModule, NativeModule } from 'expo';

// NearbyModule is not available on the web platform.
class NearbyModule extends NativeModule<{}> {}

export default registerWebModule(NearbyModule, 'NearbyModule');
