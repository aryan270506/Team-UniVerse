import { NativeModule, requireNativeModule } from 'expo';

declare class NearbyModule extends NativeModule<{}> {}

export default requireNativeModule<NearbyModule>('NearbyModule');
