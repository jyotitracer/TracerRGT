import { toastController } from '@ionic/vue';

export const showToast = async () => {
    const toast = await toastController.create({
        message: 'No Internet Connection!',
        duration: 2000,
        position: 'middle',
        color: 'danger',
        buttons: [
          {
            text: 'Ok',
            role: 'cancel'
          }
        ]
      });
      toast.present();
};

export const showToastMessage = async (message) => {
  const toast = await toastController.create({
      message: message,
      duration: 1000,
      position: 'middle',
      color: 'danger',
      // buttons: [
      //   {
      //     text: 'Ok',
      //     role: 'cancel'
      //   }
      // ]
    });
    toast.present();
};