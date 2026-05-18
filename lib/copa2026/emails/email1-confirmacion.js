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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailConfirmacion = sendEmailConfirmacion;
var email_service_1 = require("../../email-service");
function sendEmailConfirmacion(props) {
    return __awaiter(this, void 0, void 0, function () {
        var nombre, email, categoria, montoBs, telefonoPago, tokenVideo, baseUrl, linkUpload, telMasked, htmlContent;
        return __generator(this, function (_a) {
            nombre = props.nombre, email = props.email, categoria = props.categoria, montoBs = props.montoBs, telefonoPago = props.telefonoPago, tokenVideo = props.tokenVideo;
            baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://copa2026.centauroads.com';
            linkUpload = "".concat(baseUrl, "/registro/video/").concat(tokenVideo);
            telMasked = telefonoPago.length >= 4
                ? "****-***-".concat(telefonoPago.slice(-4))
                : telefonoPago;
            htmlContent = "\n    <!DOCTYPE html>\n    <html lang=\"es\">\n    <head>\n        <meta charset=\"UTF-8\">\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n        <style>\n            body { font-family: 'Inter', Arial, sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }\n            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; border: 1px solid #222; border-radius: 12px; margin-top: 40px; }\n            .header { text-align: center; margin-bottom: 30px; }\n            .title { font-size: 24px; font-weight: bold; color: #fff; margin-bottom: 10px; }\n            .subtitle { font-size: 16px; color: #888; }\n            .content { font-size: 15px; line-height: 1.6; color: #ddd; }\n            .details-box { background-color: #111; border: 1px solid #333; padding: 20px; border-radius: 8px; margin: 25px 0; }\n            .details-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #222; padding-bottom: 10px; }\n            .details-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }\n            .details-label { color: #888; }\n            .details-value { font-weight: bold; color: #fff; }\n            .button-container { text-align: center; margin: 35px 0; }\n            .button { display: inline-block; background: linear-gradient(135deg, #FF3366 0%, #FF9933 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: bold; font-size: 16px; letter-spacing: 0.5px; }\n            .specs { background-color: #1a1a1a; padding: 20px; border-radius: 8px; font-size: 14px; color: #bbb; border-left: 4px solid #FF3366; }\n            .specs ul { margin-top: 10px; padding-left: 20px; }\n            .specs li { margin-bottom: 6px; }\n            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }\n        </style>\n    </head>\n    <body>\n        <div class=\"container\">\n            <div class=\"header\">\n                <div class=\"title\">\u00A1Inscripci\u00F3n Confirmada! \uD83C\uDF89</div>\n                <div class=\"subtitle\">Bienvenido a la Copa Santa 3D 2026</div>\n            </div>\n            \n            <div class=\"content\">\n                <p>Hola <strong>".concat(nombre, "</strong>,</p>\n                <p>Hemos recibido y validado exitosamente tu pago. Est\u00E1s oficialmente inscrito en la categor\u00EDa <strong>").concat(categoria, "</strong>.</p>\n                \n                <div class=\"details-box\">\n                    <div class=\"details-row\">\n                        <span class=\"details-label\">Categor\u00EDa</span>\n                        <span class=\"details-value\">").concat(categoria, "</span>\n                    </div>\n                    <div class=\"details-row\">\n                        <span class=\"details-label\">Monto Validado</span>\n                        <span class=\"details-value\">Bs. ").concat(montoBs.toFixed(2), "</span>\n                    </div>\n                    <div class=\"details-row\">\n                        <span class=\"details-label\">Tel\u00E9fono Pago</span>\n                        <span class=\"details-value\">").concat(telMasked, "</span>\n                    </div>\n                </div>\n\n                <p>A continuaci\u00F3n, tienes tu enlace \u00FAnico y privado para cargar tu video participante. Este enlace es intransferible.</p>\n                \n                <div class=\"button-container\">\n                    <a href=\"").concat(linkUpload, "\" class=\"button\">Subir mi Video Ahora</a>\n                </div>\n\n                <div class=\"specs\">\n                    <strong>Especificaciones T\u00E9cnicas Estrictas del Video:</strong>\n                    <ul>\n                        <li><strong>Resoluci\u00F3n:</strong> 1024x2048 p\u00EDxeles</li>\n                        <li><strong>Duraci\u00F3n:</strong> Entre 25 y 30 segundos</li>\n                        <li><strong>Framerate:</strong> 30 FPS</li>\n                        <li><strong>Formato:</strong> MP4 (H.264)</li>\n                        <li><strong>Fecha l\u00EDmite de carga:</strong> 05 de Junio, 2026 (23:59 VET)</li>\n                    </ul>\n                </div>\n            </div>\n            \n            <div class=\"footer\">\n                Este es un correo autom\u00E1tico, por favor no respondas a este mensaje.<br>\n                Copa Santa 3D 2026 &copy; Centauro ADS\n            </div>\n        </div>\n    </body>\n    </html>\n    ");
            return [2 /*return*/, email_service_1.EmailService.send({
                    to: email,
                    subject: 'Copa 2026: Inscripción Confirmada y Token de Carga',
                    html: htmlContent
                })];
        });
    });
}
