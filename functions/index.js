const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const config = {
    apiKey: "AIzaSyACXMS7GwrLhC6UydbEzSDlIdBMYScg7NQ",
    authDomain: "socialape-a74d3.firebaseapp.com",
    databaseURL: "https://socialape-a74d3.firebaseio.com",
    projectId: "socialape-a74d3",
    storageBucket: "socialape-a74d3.appspot.com",
    messagingSenderId: "896900813344",
    appId: "1:896900813344:web:654f6883e8e6a513"
};

//shorter then const app = require('express') and const app = express()
const app = require('express')();

const firebase = require('firebase');
firebase.initializeApp(config);

const db = admin.firestore();

// fetching with db

app.get('/screams', (req, res) => {
    db
        .collection('screams')
        .orderBy('createAt', 'desc')
        .get()
        .then((data) => {
            let screams = [];
            data.forEach((doc) => {
                screams.push({
                    screamId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createAt: doc.data().createAt
                });
            });
            return res.json(screams);
        })
        .catch(err => console.error(err));
})

app.post('/scream', (req, res) => {

    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createAt: new Date().toISOString()
    };

    db
        .collection('screams')
        .add(newScream)
        .then((doc) => {
            res.json({
                message: `document ${doc.id} created succesfully, perfect!`
            });
        })
        .catch((err) => {
            res.status(500).json({
                error: 'something went wrong, sorry! '
            });
            console.error(err);
        });
});

// Singup route

app.post('/singup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };

    // TODO: validate data

    let token, userId;

    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({
                    handle: 'this handle is already taken'
                })
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        })
        .then(data => {
            userId = data.user.uid
            return data.user.getIdToken();
        })
        .then(idToken => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createAt: new Date().toISOString(),
                userId
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({
                token
            });
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({
                    email: "Email is already in use"
                })
            } else {
                return res.status(500).json({
                    error: err.code
                });
            }
        });
})


// https://baseurl.com/api/

// router making
//changing zone to europe --------\/
exports.api = functions.region('europe-west1').https.onRequest(app);