import { BotFrameworkAdapter, MemoryStorage, ConversationState } from 'botbuilder';
import * as azure from 'botbuilder-azure'
import * as restify from 'restify';

// Create server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log(`${server.name} listening to ${server.url}`);
});

// Create adapter
const adapter = new BotFrameworkAdapter({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Define conversation state shape
interface EchoState {
    count: number;
}

var storage;

// get the state manager table storage
if (process.env.USE_TABLE_STORAGE) {
    var tableName = process.env.STATE_TABLE_NAME
    var storageAccountName = process.env.STORAGE_ACCOUNT_NAME;
    var storageAccountKey = process.env.STORAGE_ACCOUNT_KEY;

    //var azureTableClient = new azure.AzureTableClient(tableName, 'UseDevelopmentStorage=true');
    var azureTableClient = new azure.AzureTableClient(tableName, storageAccountName, storageAccountKey);
    storage = new azure.AzureBotStorage({ gzipData: false }, azureTableClient);
    console.log(`Using Azure Table Storage [${storageAccountName}/${tableName}]`);
} else{
    console.log('Using Memory Storage');
    storage = new MemoryStorage();
}

// Add conversation state  middleware
const conversationState = new ConversationState<EchoState>(storage);
adapter.use(conversationState);

server.get('/status', (req,res) => {
    res.send(JSON.stringify({alive: true}));
})


// Listen for incoming requests 
server.post('/api/messages', (req, res) => {
    // Route received request to adapter for processing
    try {

        adapter.processActivity(req, res, async (context) => {
            console.log(req.body)
            if (context.activity.type === 'message') {
                console.log('activity type is message');
                const state = conversationState.get(context);
                const count = state.count === undefined ? state.count = 0 : ++state.count;
                await context.sendActivity(`${count}: You said "${context.activity.text}"`);
            } else {
                console.log(`Replying: [${context.activity.type} event detected]`)
                await context.sendActivity(`[${context.activity.type} event detected]`);
            }
        });
    } catch (err) {
        console.log(err)
    }
});