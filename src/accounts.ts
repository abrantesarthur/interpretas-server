import { RequestHandler } from "express";

// ==================== DEFINE HANDLERS ====================== //

const signup : RequestHandler = (req, res) => {
    res.end("\nsignup");
}

const login : RequestHandler = (req, res) => {
    res.end("\nlogin");
}


// ==================== EXPORT HANDLERS ====================== //

export {signup, login};