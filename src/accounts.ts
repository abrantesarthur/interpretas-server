import { RequestHandler } from "express";

import {v4 as uuid} from 'uuid';


// ==================== DEFINE HANDLERS ====================== //

const signup : RequestHandler = (req, res) => {
    res.end("\nsignup");
}

const login : RequestHandler = (req, res) => {
    uuid()
    res.end("\nlogin");
}


// ==================== EXPORT HANDLERS ====================== //

export {signup, login};