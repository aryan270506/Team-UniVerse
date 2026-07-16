package com.sekirohub.MeshLink

import android.util.Log
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.*
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NearbyModule : Module() {
    private val TAG = "NearbyModule"
    private val SERVICE_ID = "com.sekirohub.MeshLink.SERVICE"
    private val STRATEGY = Strategy.P2P_CLUSTER

   private val context
    get() = requireNotNull(appContext.reactContext) {
        "ReactContext is null"
    }

    private val payloadCallback = object : PayloadCallback() {
        override fun onPayloadReceived(endpointId: String, payload: Payload) {
            if (payload.type == Payload.Type.BYTES) {
                val bytes = payload.asBytes()
                if (bytes != null) {
                    val message = String(bytes, Charsets.UTF_8)
                    sendEvent("onPayloadReceived", mapOf(
                        "endpointId" to endpointId,
                        "payload" to message
                    ))
                }
            }
        }

        override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {}
    }

    private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
        override fun onConnectionInitiated(endpointId: String, connectionInfo: ConnectionInfo) {
            Log.d(TAG, "Connection initiated with $endpointId (${connectionInfo.endpointName})")
            sendEvent("onConnectionRequest", mapOf(
                "endpointId" to endpointId,
                "displayName" to connectionInfo.endpointName
            ))
        }

        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
            if (result.status.isSuccess) {
                Log.d(TAG, "Connected successfully to $endpointId")
                sendEvent("onPeerConnected", mapOf(
                    "endpointId" to endpointId,
                    "success" to true,
                    "displayName" to "Mesh Node"
                ))
            } else {
                Log.d(TAG, "Connection failed with $endpointId")
                sendEvent("onConnectionRejected", mapOf(
                    "endpointId" to endpointId,
                    "success" to false,
                    "error" to (result.status.statusMessage ?: "Connection failed")
                ))
            }
        }

        override fun onDisconnected(endpointId: String) {
            Log.d(TAG, "Disconnected from $endpointId")
            sendEvent("onPeerDisconnected", mapOf(
                "endpointId" to endpointId
            ))
        }
    }

    private val endpointDiscoveryCallback = object : EndpointDiscoveryCallback() {
        override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
            Log.d(TAG, "Endpoint found: $endpointId (${info.endpointName})")
            sendEvent("onPeerDiscovered", mapOf(
                "endpointId" to endpointId,
                "displayName" to info.endpointName
            ))
        }

        override fun onEndpointLost(endpointId: String) {
            Log.d(TAG, "Endpoint lost: $endpointId")
            sendEvent("onPeerDisconnected", mapOf(
                "endpointId" to endpointId
            ))
        }
    }

    override fun definition() = ModuleDefinition {
        Name("NearbyModule")

        Events("onPeerDiscovered", "onConnectionRequest", "onPeerConnected", "onPeerDisconnected", "onConnectionRejected", "onPayloadReceived")

        Function("startAdvertising") { displayName: String ->
            val advertisingOptions = AdvertisingOptions.Builder().setStrategy(STRATEGY).build()
            Nearby.getConnectionsClient(context)
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

        Function("startDiscovery") {
            val discoveryOptions = DiscoveryOptions.Builder().setStrategy(STRATEGY).build()
            Nearby.getConnectionsClient(context)
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

        Function("requestPeerConnection") { endpointId: String, displayName: String ->
            Nearby.getConnectionsClient(context)
                .requestConnection(displayName, endpointId, connectionLifecycleCallback)
                .addOnSuccessListener {
                    Log.d(TAG, "Requested connection to $endpointId")
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Failed to request connection", e)
                    sendEvent("onConnectionRejected", mapOf(
                        "endpointId" to endpointId,
                        "success" to false,
                        "error" to (e.message ?: "Failed to request connection")
                    ))
                }
        }

        Function("acceptPeerConnection") { endpointId: String ->
            Nearby.getConnectionsClient(context)
                .acceptConnection(endpointId, payloadCallback)
                .addOnSuccessListener {
                    Log.d(TAG, "Accepted connection from $endpointId")
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Failed to accept connection", e)
                }
        }

        Function("rejectPeerConnection") { endpointId: String ->
    try {
        Nearby.getConnectionsClient(context)
            .rejectConnection(endpointId)

        Log.d(TAG, "Rejected connection from $endpointId")
    } catch (e: Exception) {
        Log.e(TAG, "Failed to reject connection", e)
    }
}
        Function("disconnectPeer") { endpointId: String ->
    try {
        Nearby.getConnectionsClient(context)
            .disconnectFromEndpoint(endpointId)

        Log.d(TAG, "Disconnected from $endpointId")
    } catch (e: Exception) {
        Log.e(TAG, "Failed to disconnect from $endpointId", e)
    }
}

        Function("stopAdvertising") {
            Nearby.getConnectionsClient(context).stopAdvertising()
            Log.d(TAG, "Stopped advertising")
        }

        Function("stopDiscovery") {
            Nearby.getConnectionsClient(context).stopDiscovery()
            Log.d(TAG, "Stopped discovery")
        }

        Function("sendPayload") { endpointId: String, payloadString: String ->
    val bytes = payloadString.toByteArray(Charsets.UTF_8)
    val payload = Payload.fromBytes(bytes)

    try {
        Nearby.getConnectionsClient(context)
            .sendPayload(listOf(endpointId), payload)

        Log.d(TAG, "Payload sent to $endpointId")
    } catch (e: Exception) {
        Log.e(TAG, "Failed to send payload to $endpointId", e)
    }
}
    }
}
