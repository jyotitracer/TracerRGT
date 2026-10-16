import { Network } from '@capacitor/network';
import { ref } from 'vue';


export default function useNetwork() {
    const isConnected = ref(true);
    const showReconnectedMessage = ref(false);
    let reconnectTimeout = null;


    const checkNetworkStatus = async () => {
        const status = await Network.getStatus();
        isConnected.value = status.connected;
      };
  
    const listenToNetworkChanges = () => {
    
      Network.addListener('networkStatusChange', (status) => {
        isConnected.value = status.connected;

        if (status.connected) {
          // Show "Connected" message for 3 seconds when network reconnects
          showReconnectedMessage.value = true;
          if (reconnectTimeout) clearTimeout(reconnectTimeout);
          
          reconnectTimeout = setTimeout(() => {
            showReconnectedMessage.value = false;
          }, 10000); // Show for 3 seconds
        }else
        {

        }

        console.log("displayisConnected",isConnected.value);
      });
    };
  
    // Initialize network status check and event listener
    const initNetworkListener = () => {
      checkNetworkStatus();
      listenToNetworkChanges();
    };
  
    const removeNetworkListener = () => {
      Network.removeAllListeners();
    };

    return {
      isConnected,
      initNetworkListener,
      removeNetworkListener,
      checkNetworkStatus,
      showReconnectedMessage
    };
}