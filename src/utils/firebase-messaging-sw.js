// import { getMessaging, getToken } from "firebase/messaging";

// // Get registration token. Initially this makes a network call, once retrieved
// // subsequent calls to getToken will return from cache.
// importScripts(
//   "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
// );
// importScripts(
//   "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
// );

// const messaging = getMessaging();
// getToken(messaging, { vapidKey: 'BOtn5Dtm_Hr9pwHL6E8QtTAvtUgxpb6YPbKeTQQ1HJvBJEKpEA8B5Gospsx0EX5H_IIUTfFgzWbaRWDGM_6_43A' }).then((currentToken) => {
//   if (currentToken) {
//     // Send the token to your server and update the UI if necessary
//     // ...
//   } else {
//     // Show permission request UI
//     console.log('No registration token available. Request permission to generate one.');
//     // ...
//   }
// }).catch((err) => {
//   console.log('An error occurred while retrieving token. ', err);
//   // ...
// });