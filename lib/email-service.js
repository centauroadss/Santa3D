"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
var resend_1 = require("resend");
var nodemailer = require("nodemailer");
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
// Initialize Providers
var resend = null;
var resendKey = process.env.RESEND_API_KEY;
if (resendKey) {
    resend = new resend_1.Resend(resendKey);
}
// Nodemailer transport
var transporter = null;
if (process.env.EMAIL_PROVIDER === 'smtp') {
    transporter = nodemailer.createTransport({
        service: 'gmail', // Asumiendo que es gmail basado en centauroadss@gmail.com
        auth: {
            user: process.env.SMTP_USER,
            pass: (_a = process.env.SMTP_PASS) === null || _a === void 0 ? void 0 : _a.replace(/'/g, ''), // Limpiar comillas si las hay
        }
    });
}
exports.EmailService = {
    send: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var messageId, info, resendData, dbError_1, error_1;
        var _c;
        var to = _b.to, subject = _b.subject, html = _b.html, _d = _b.tipo, tipo = _d === void 0 ? 'GENERAL' : _d, attachments = _b.attachments;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    console.log("[EmailService] \u26A1 SOLICITUD DE ENV\u00CDO DETECTADA a: ".concat(to));
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 11, , 12]);
                    if (!(process.env.EMAIL_PROVIDER === 'smtp' && transporter)) return [3 /*break*/, 3];
                    console.log('📧 Usando Nodemailer (SMTP)...');
                    return [4 /*yield*/, transporter.sendMail({
                            from: process.env.SMTP_FROM_EMAIL || 'mercadeo@centauroads.com',
                            to: to,
                            bcc: 'mercadeo@centauroads.com',
                            subject: subject,
                            html: html,
                            attachments: attachments === null || attachments === void 0 ? void 0 : attachments.map(function (att) { return ({
                                filename: att.filename,
                                content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content, 'base64'),
                                contentType: att.type
                            }); })
                        })];
                case 2:
                    info = _e.sent();
                    messageId = info.messageId;
                    return [3 /*break*/, 6];
                case 3:
                    if (!resend) return [3 /*break*/, 5];
                    console.log('📧 Usando Resend...');
                    return [4 /*yield*/, resend.emails.send({
                            from: 'mercadeo@centauroads.com',
                            to: to,
                            bcc: 'mercadeo@centauroads.com',
                            subject: subject,
                            html: html,
                            attachments: attachments === null || attachments === void 0 ? void 0 : attachments.map(function (att) { return ({
                                filename: att.filename,
                                content: att.content,
                            }); }),
                        })];
                case 4:
                    resendData = _e.sent();
                    if (resendData.error) {
                        console.error('❌ [EmailService] API Error:', resendData.error);
                        return [2 /*return*/, { success: false, error: resendData.error }];
                    }
                    messageId = (_c = resendData.data) === null || _c === void 0 ? void 0 : _c.id;
                    return [3 /*break*/, 6];
                case 5:
                    console.error('❌ [EmailService] No hay proveedor de correo configurado.');
                    return [2 /*return*/, { success: false, error: 'No email provider configured' }];
                case 6:
                    console.log('✅ [EmailService] ENVÍO EXITOSO (ID):', messageId);
                    _e.label = 7;
                case 7:
                    _e.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, prisma.emailLog.create({
                            data: {
                                resendId: messageId,
                                to: to,
                                subject: subject,
                                tipo: tipo,
                                status: 'ENVIADO'
                            }
                        })];
                case 8:
                    _e.sent();
                    return [3 /*break*/, 10];
                case 9:
                    dbError_1 = _e.sent();
                    console.error('❌ [EmailService] Error guardando log en BD:', dbError_1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/, { success: true }];
                case 11:
                    error_1 = _e.sent();
                    console.error('❌ [EmailService] EXCEPCIÓN:', error_1);
                    return [2 /*return*/, { success: false, error: error_1.message }];
                case 12: return [2 /*return*/];
            }
        });
    }); }
};
