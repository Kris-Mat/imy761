/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UserController } from './../../../../shared/server/src/controllers/user.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MonolithController } from './../../../../shared/server/src/controllers/monolith.controller';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "User": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "username": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "firstName": {"dataType":"string","required":true},
            "lastName": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HorizonCharacteristic": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "text": {"dataType":"string","required":true},
            "orderIndex": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Horizon": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "label": {"dataType":"string","required":true},
            "orderIndex": {"dataType":"double","required":true},
            "colourText": {"dataType":"string","required":true},
            "colourHue": {"dataType":"string","required":true},
            "colourValue": {"dataType":"double","required":true},
            "colourChroma": {"dataType":"double","required":true},
            "characteristics": {"dataType":"array","array":{"dataType":"refObject","ref":"HorizonCharacteristic"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "QuestionCategory": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["DIAGNOSTIC_HORIZONS"]},{"dataType":"enum","enums":["SOIL_FORM"]},{"dataType":"enum","enums":["LANDSCAPE_POSITION"]},{"dataType":"enum","enums":["SUITABILITY"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AnswerOption": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "text": {"dataType":"string","required":true},
            "isCorrect": {"dataType":"boolean","required":true},
            "orderIndex": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Question": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "category": {"ref":"QuestionCategory","required":true},
            "orderIndex": {"dataType":"double","required":true},
            "prompt": {"dataType":"string","required":true},
            "options": {"dataType":"array","array":{"dataType":"refObject","ref":"AnswerOption"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SoilFamilyField": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "label": {"dataType":"string","required":true},
            "correctValue": {"dataType":"string","required":true},
            "orderIndex": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SoilFamilyCode": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "finalCode": {"dataType":"string","required":true},
            "soilFamilyName": {"dataType":"string","required":true},
            "fields": {"dataType":"array","array":{"dataType":"refObject","ref":"SoilFamilyField"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Monolith": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "name": {"dataType":"string","required":true},
            "imageUrl": {"dataType":"string","required":true},
            "finalSoilForm": {"dataType":"string","required":true},
            "orderIndex": {"dataType":"double","required":true},
            "horizons": {"dataType":"array","array":{"dataType":"refObject","ref":"Horizon"},"required":true},
            "questions": {"dataType":"array","array":{"dataType":"refObject","ref":"Question"},"required":true},
            "soilFamilyCode": {"dataType":"union","subSchemas":[{"ref":"SoilFamilyCode"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsUserController_getUser: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/users',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getUser)),

            async function UserController_getUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUser, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMonolithController_getMonoliths: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/monoliths',
            ...(fetchMiddlewares<RequestHandler>(MonolithController)),
            ...(fetchMiddlewares<RequestHandler>(MonolithController.prototype.getMonoliths)),

            async function MonolithController_getMonoliths(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMonolithController_getMonoliths, request, response });

                const controller = new MonolithController();

              await templateService.apiHandler({
                methodName: 'getMonoliths',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
