package com.sekirohub.MeshLink

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.*

class NearbyModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val TAG = "NearbyModule"
    private val SERVICE_ID = "com.sekirohub.MeshLink.SERVICE"
    private val STRATEGY = Strategy.P2P_CLUSTER

    override fun getName(): String {
        return "NearbyModule"
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // Callback for when payloads (messages) arrive
    private val payloadCallback = object : PayloadCallback() {
        override fun onPayloadReceived(endpointId: String, payload: Payload) {
            if (payload.type == Payload.Type.BYTES) {
                val bytes = payload.asBytes()
                if (bytes != null) {
                    val message = String(bytes, Charsets.UTF_8)
                    val params = Arguments.createMap().apply {
                        putString("endpointId", endpointId)
                        putString("payload", message)
                    }
                    sendEvent("onPayloadReceived", params)
                }
            }
        }

        override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {
            // Can be used to track progress of sending/receiving
        }
    }

    // Callbacks for connections to other devices
    private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
        override fun onConnectionInitiated(endpointId: String, connectionInfo: ConnectionInfo) {
            Log.d(TAG, "Connection initiated with $endpointId (${connectionInfo.endpointName})")
            // Automatically accept the connection on both sides
            Nearby.getConnectionsClient(reactContext)
                .acceptConnection(endpointId, payloadCallback)
        }

        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
            val params = Arguments.createMap().apply {
                putString("endpointId", endpointId)
            }
            if (result.status.isSuccess) {
                Log.d(TAG, "Connected successfully to $endpointId")
                params.putBoolean("success", true)
                params.putString("displayName", "Mesh Node") // Temporary, or resolved from connection name
                sendEvent("onPeerConnected", params)
            } else {
                Log.d(TAG, "Connection failed with $endpointId")
                params.putBoolean("success", false)
            }
        }

        override fun onDisconnected(endpointId: String) {
            Log.d(TAG, "Disconnected from $endpointId")
            val params = Arguments.createMap().apply {
                putString("endpointId", endpointId)
            }
            sendEvent("onPeerDisconnected", params)
        }
    }

    // Callbacks for finding other devices
    private val endpointDiscoveryCallback = object : EndpointDiscoveryCallback() {
        override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
            Log.d(TAG, "Endpoint found: $endpointId (${info.endpointName})")
            // Automatically request connection to establish mesh link
            Nearby.getConnectionsClient(reactContext)
                .requestConnection(info.endpointName, endpointId, connectionLifecycleCallback)
        }

        override fun onEndpointLost(endpointId: String) {
            Log.d(TAG, "Endpoint lost: $endpointId")
            val params = Arguments.createMap().apply {
                putString("endpointId", endpointId)
            }
            sendEvent("onPeerDisconnected", params)
        }
    }

    @ReactMethod
    fun startAdvertising(displayName: String) {
        val advertisingOptions = AdvertisingOptions.Builder().setStrategy(STRATEGY).build()
        Nearby.getConnectionsClient(reactContext)
            .startAdvertising(
                displayName,
                SERVICE_ID,
                connectionLifecycleCallback,
                advertisingOptions
            )
            .addOnSuccessListener {
                Log.d(TAG, "Started advertising as $displayName")
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed to start advertising", e)
            }
    }

    @ReactMethod
    fun startDiscovery() {
        val discoveryOptions = DiscoveryOptions.Builder().setStrategy(STRATEGY).build()
        Nearby.getConnectionsClient(reactContext)
            .startDiscovery(
                SERVICE_ID,
                endpointDiscoveryCallback,
                discoveryOptions
            )
            .addOnSuccessListener {
                Log.d(TAG, "Started discovery")
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed to start discovery", e)
            }
    }

    @ReactMethod
    fun stopAdvertising() {
        Nearby.getConnectionsClient(reactContext).stopAdvertising()
        Log.d(TAG, "Stopped advertising")
    }

    @ReactMethod
    fun stopDiscovery() {
        Nearby.getConnectionsClient(reactContext).stopDiscovery()
        Log.d(TAG, "Stopped discovery")
    }

    @ReactMethod
    fun sendPayload(endpointId: String, payloadString: String) {
        val bytes = payloadString.toByteArray(Charsets.UTF_8)
        val payload = Payload.fromBytes(bytes)
        Nearby.getConnectionsClient(reactContext)
            .sendPayload(endpointId, payload)
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed to send payload to $endpointId", e)
            }
    }
}
