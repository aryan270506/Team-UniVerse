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
            // Transfer progress can be surfaced later if attachment transfer is added.
        }
    }

    // Callbacks for connections to other devices
    private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
        override fun onConnectionInitiated(endpointId: String, connectionInfo: ConnectionInfo) {
            Log.d(TAG, "Connection initiated with $endpointId (${connectionInfo.endpointName})")
            val params = Arguments.createMap().apply {
                putString("endpointId", endpointId)
                putString("displayName", connectionInfo.endpointName)
            }
            sendEvent("onConnectionRequest", params)
        }

        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
            val params = Arguments.createMap().apply {
                putString("endpointId", endpointId)
            }
            if (result.status.isSuccess) {
                Log.d(TAG, "Connected successfully to $endpointId")
                params.putBoolean("success", true)
                params.putString("displayName", "Mesh Node")
                sendEvent("onPeerConnected", params)
            } else {
                Log.d(TAG, "Connection failed with $endpointId")
                params.putBoolean("success", false)
                params.putString("error", result.status.statusMessage ?: "Connection failed")
                sendEvent("onConnectionRejected", params)
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
            val params = Arguments.createMap().apply {
                putString("endpointId", endpointId)
                putString("displayName", info.endpointName)
            }
            sendEvent("onPeerDiscovered", params)
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
        try {
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
        } catch (e: Exception) {
            Log.e(TAG, "Exception in startAdvertising", e)
        }
    }

    @ReactMethod
    fun startDiscovery() {
        try {
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
        } catch (e: Exception) {
            Log.e(TAG, "Exception in startDiscovery", e)
        }
    }

    @ReactMethod
    fun requestPeerConnection(endpointId: String, displayName: String) {
        try {
            Nearby.getConnectionsClient(reactContext)
                .requestConnection(displayName, endpointId, connectionLifecycleCallback)
                .addOnSuccessListener {
                    Log.d(TAG, "Requested connection to $endpointId")
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Failed to request connection", e)
                    val params = Arguments.createMap().apply {
                        putString("endpointId", endpointId)
                        putBoolean("success", false)
                        putString("error", e.message ?: "Failed to request connection")
                    }
                    sendEvent("onConnectionRejected", params)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Exception in requestPeerConnection", e)
            val params = Arguments.createMap().apply {
                putString("endpointId", endpointId)
                putBoolean("success", false)
                putString("error", e.message ?: "Exception in requestPeerConnection")
            }
            sendEvent("onConnectionRejected", params)
        }
    }

    @ReactMethod
    fun acceptPeerConnection(endpointId: String) {
        try {
            Nearby.getConnectionsClient(reactContext)
                .acceptConnection(endpointId, payloadCallback)
                .addOnSuccessListener {
                    Log.d(TAG, "Accepted connection from $endpointId")
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Failed to accept connection", e)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Exception in acceptPeerConnection", e)
        }
    }

    @ReactMethod
    fun rejectPeerConnection(endpointId: String) {
        try {
            Nearby.getConnectionsClient(reactContext)
                .rejectConnection(endpointId)
                .addOnSuccessListener {
                    Log.d(TAG, "Rejected connection from $endpointId")
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Failed to reject connection", e)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Exception in rejectPeerConnection", e)
        }
    }

    @ReactMethod
    fun disconnectPeer(endpointId: String) {
        try {
            Nearby.getConnectionsClient(reactContext)
                .disconnectFromEndpoint(endpointId)
                .addOnSuccessListener {
                    Log.d(TAG, "Disconnected from $endpointId")
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Failed to disconnect from $endpointId", e)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Exception in disconnectPeer", e)
        }
    }

    @ReactMethod
    fun stopAdvertising() {
        try {
            Nearby.getConnectionsClient(reactContext).stopAdvertising()
            Log.d(TAG, "Stopped advertising")
        } catch (e: Exception) {
            Log.e(TAG, "Exception in stopAdvertising", e)
        }
    }

    @ReactMethod
    fun stopDiscovery() {
        try {
            Nearby.getConnectionsClient(reactContext).stopDiscovery()
            Log.d(TAG, "Stopped discovery")
        } catch (e: Exception) {
            Log.e(TAG, "Exception in stopDiscovery", e)
        }
    }

    @ReactMethod
    fun sendPayload(endpointId: String, payloadString: String) {
        try {
            val bytes = payloadString.toByteArray(Charsets.UTF_8)
            val payload = Payload.fromBytes(bytes)
            Nearby.getConnectionsClient(reactContext)
                .sendPayload(endpointId, payload)
                .addOnFailureListener { e ->
                    Log.e(TAG, "Failed to send payload to $endpointId", e)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Exception in sendPayload to $endpointId", e)
        }
    }
}
