export const sendExpoPushNotification = async(expoPushToken, title, message) =>{
    if (!expoPushToken) return;

    try {
        const response = await axios.post('https://exp.host/--/api/v2/push/send', {
            to: expoPushToken,
            title,
            body: message,
            priority: 'high',
            sound: 'default',
        });
        console.log('Expo notification sent:', response.data);
    } catch (error) {
        console.error('Expo push error:', error.message);
    }
}
