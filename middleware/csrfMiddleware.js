import csrf from "csurf"
import cookieParser from "cookie-parser";
import {app} from './../socket/socket.js'
app.use(cookieParser());

export const csrfProtection = csrf({
    cookie: {
      httpOnly: true,  // Prevent access to the cookie from JavaScript
      secure: process.env.NODE_ENV === "production", // Ensure it's sent over HTTPS in production
      sameSite: "lax", // CSRF cookie rules
    }
  });