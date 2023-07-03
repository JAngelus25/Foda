/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
 
 
const Alexa = require('ask-sdk-core');
const AWS = require("aws-sdk");
const ddbAdapter = require('ask-sdk-dynamodb-persistence-adapter');
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Olá bem vindo a nossa FAESA mecânica\n Para adicionar um carro fale ADCIONAR \n Para verificar um histórico de serviço fale HISTÓRICO \n Para exluir um cadastro fale REMOVER \n Para cancelar um serviço fale CANCELAR \n Para agendar um serviço fale AGENDAR. ';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const AutoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AutoIntent';
    },
    async handle(handlerInput) {
        const placa = Alexa.getSlotValue(handlerInput.requestEnvelope, 'addPlaca');

        // Verifica se a placa já está cadastrada
        var objeto = await handlerInput.attributesManager.getPersistentAttributes() || {};
        var automoveis = objeto.automovel || [];
        var placaExistente = automoveis.find((auto) => auto.placa === placa);

        let speakOutput;
        if (placaExistente) {
            speakOutput = `A placa ${placa} já está cadastrada no sistema.`;
        } else {
            const nome = Alexa.getSlotValue(handlerInput.requestEnvelope, 'addNome');
            const modelo = Alexa.getSlotValue(handlerInput.requestEnvelope, 'addModelo');
            const cor = Alexa.getSlotValue(handlerInput.requestEnvelope, 'addCor');

            // Cria um novo objeto de automóvel
            const novoAutomovel = {
                nome: nome,
                modelo: modelo,
                cor: cor,
                placa: placa
            };

            // Adiciona o novo automóvel à lista de automóveis
            automoveis.push(novoAutomovel);
            objeto.automovel = automoveis;

            // Salva os dados na base de dados
            handlerInput.attributesManager.setPersistentAttributes(objeto);
            await handlerInput.attributesManager.savePersistentAttributes();

            speakOutput = "Dados cadastrados com sucesso.";
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const HisServIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "HisServIntent"
    );
  },
  async handle(handlerInput) {
    const placa = Alexa.getSlotValue(handlerInput.requestEnvelope, "addPlaca");

    // Recupera os agendamentos do automóvel
    const objeto = await handlerInput.attributesManager.getPersistentAttributes() || {};
    const agendamentos = objeto.agendamentos || [];

    // Filtra os agendamentos pelo automóvel com a placa fornecida
    const agendamentosDoAutomovel = agendamentos.filter(
      (agendamento) => agendamento.placa === placa
    );

    let speakOutput = "";

    if (agendamentosDoAutomovel.length > 0) {
      speakOutput = `Os agendamentos anteriores para o automóvel com a placa ${placa} são:`;

      agendamentosDoAutomovel.forEach((agendamento) => {
        speakOutput += `Serviço: ${agendamento.servico}, Data: ${agendamento.data}. `;
      });
    } else {
      speakOutput = `Não há agendamentos anteriores para o automóvel com a placa ${placa}.`;
    }

    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};



const AgendarIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AgendarIntent';
    },
    async handle(handlerInput) {
        const placa = Alexa.getSlotValue(handlerInput.requestEnvelope, 'addPlaca');
        const servico = Alexa.getSlotValue(handlerInput.requestEnvelope, 'addServico');
        const data = Alexa.getSlotValue(handlerInput.requestEnvelope, 'addData');

        // Verifica se a placa já está cadastrada
        const objeto = await handlerInput.attributesManager.getPersistentAttributes() || {};
        const automoveis = objeto.automovel || [];
        let placaExistente = false;

        for (let i = 0; i < automoveis.length; i++) {
            if (automoveis[i].placa === placa) {
                placaExistente = true;
                break;
            }
        }

        let speakOutput = '';

        if (placaExistente) {
            const novoAgendamento = {
                placa: placa,
                servico: servico,
                data: data
            };

            // Adiciona o novo agendamento à lista de agendamentos
            objeto.agendamentos = objeto.agendamentos || [];
            objeto.agendamentos.push(novoAgendamento);

            // Salva os dados na base de dados
            handlerInput.attributesManager.setPersistentAttributes(objeto);
            await handlerInput.attributesManager.savePersistentAttributes();

            speakOutput = "Agendamento cadastrado com sucesso.";
        } else {
            speakOutput = "Placa não cadastrada.";
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};


const CanServIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CanServIntent';
    },
    async handle(handlerInput) {
        const placa = Alexa.getSlotValue(handlerInput.requestEnvelope, 'addPlaca');

        // Obtém os agendamentos salvos na base de dados
        const { attributesManager, serviceClientFactory } = handlerInput;
        const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
        const agendamentos = persistentAttributes.agendamentos || [];

        let speakOutput = '';

        if (agendamentos.length > 0) {
            // Verifica se existe um agendamento com a placa informada
            let agendamentoIndex = -1;
            for (let i = 0; i < agendamentos.length; i++) {
                const agendamento = agendamentos[i];

                if (agendamento.placa === placa) {
                    agendamentoIndex = i;
                    break;
                }
            }

            if (agendamentoIndex !== -1) {
                // Remove o agendamento da lista
                const agendamentoRemovido = agendamentos.splice(agendamentoIndex, 1)[0];

                // Atualiza os agendamentos na base de dados
                persistentAttributes.agendamentos = agendamentos;
                attributesManager.setPersistentAttributes(persistentAttributes);
                await attributesManager.savePersistentAttributes();

                speakOutput = `Agendamento para a placa ${placa} foi cancelado com sucesso.`;
            } else {
                speakOutput = 'Não foi encontrado um agendamento com a placa informada.';
            }
        } else {
            speakOutput = 'Não existem agendamentos para cancelar.';
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const DelAutoIntentHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'DelAutoIntent'
        );
    },
    async handle(handlerInput) {
        const placa = Alexa.getSlotValue(handlerInput.requestEnvelope, 'addPlaca');

        // Obtém os automóveis salvos na base de dados
        const { attributesManager } = handlerInput;
        const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
        const automoveis = (persistentAttributes.attributes.M.automovel.L) || [];


        let speakOutput = '';

        if (automoveis.length > 0) {
            // Verifica se existe um automóvel com a placa informada
            let autoIndex = -1;
            for (let i = 0; i < automoveis.length; i++) {
                const automovel = automoveis[i].M;

                if (automovel.placa && automovel.placa.S === placa) {
                    autoIndex = i;
                    break;
                }
            }

            if (autoIndex !== -1) {
                // Remove o automóvel da lista
                const automovelRemovido = automoveis.splice(autoIndex, 1)[0];

                // Atualiza os automóveis na base de dados
                persistentAttributes.automoveis = automoveis;
                await attributesManager.savePersistentAttributes();

                speakOutput = `O automóvel com a placa ${placa} foi removido com sucesso.`;
            } else {
                speakOutput = 'Não foi encontrado um automóvel com a placa informada.';
            }
        } else {
            speakOutput = 'Não existem automóveis para remover.';
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};




const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};


/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        AutoIntentHandler,
        DelAutoIntentHandler,
        CanServIntentHandler,
        AgendarIntentHandler,
        HisServIntentHandler,
        HelpIntentHandler,
        HelloWorldIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .withPersistenceAdapter(
        new ddbAdapter.DynamoDbPersistenceAdapter({
            tableName: process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
            createTable: false,
            dynamoDBClient: new AWS.DynamoDB({apiVersion: 'latest', region: process.env.DYNAMODB_PERSISTENCE_REGION})
        })
    )
    .lambda();