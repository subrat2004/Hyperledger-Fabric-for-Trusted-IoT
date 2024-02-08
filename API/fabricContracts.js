const { isUtf8 } = require('buffer');
const FabricCAServices=require('fabric-ca-client')
const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const fs=require('fs')
const path=require('path');
const ccpPath=path.resolve(__dirname,'connection.json')
const ccpJSON=fs.readFileSync(ccpPath,'utf-8')
const ccp=JSON.parse(ccpJSON)


//fabricContracts class contains function for admin registration,user registration,sensor registration,adding temperature to the network and getting temperture history

class fabricContracts{
    //admin willl sing up with a name and a password

 async enrollAdmin(adminName,Password){
try{
    const caURL = ccp.certificateAuthorities['caorg1'].url;
    const ca = new FabricCAServices(caURL);
//creating new file system based wallet for managing identities
const WalletPath= path.join(process.cwd(),'wallet');
const wallet=new FileSystemWallet(WalletPath);
console.log(`Wallet path: ${WalletPath}`);

//checking if admin is the already present as a  user
const AdminExists=await wallet.exists(adminName);
if (AdminExists) {
    console.log(`An user with the same identity exists in the wallet with username ${username}`);
    return;
}
const enrollAdmin=await ca.enroll({
    enrollmentID: adminName,
    Password: Password
});
const identity=X509WalletMixin.createIdentity('Org1MSP', enrollAdmin.certificate, enrollment.key.toBytes());
wallet.import(adminName, identity);
console.log('Successfully enrolled admin user \"', adminName, '\" and imported it into the wallet');
return identity;


} catch(error){
    console.error(`Failed to enroll admin user  \"`, adminName, `\" : ${error}`);
    return error;
}

 }


 async RegisterUser(username,AdminName){
   try{ const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    const userExists = await wallet.exists(username);
    if (userExists) {
        console.log('An identity for the user \"', username, '\" already exists in the wallet');
        return;
    }
//also checking if the user is existing as an admin
const adminExists = await wallet.exists(AdminName);
if (!adminExists) {
    console.log('An identity for the admin user \"', AdminName, '\" does not exist in the wallet');
    console.log('Run the enrollAdmin.js application before retrying');
    return;
}
//creating the new gateway for  connecting to our peer node
const gateway=new Gateway();
await gateway.connect(ccp,{wallet,idenity:AdminName,discovery:{enabled:false}});
 // Get the CA client object from the gateway for interacting with the CA.
 const ca = gateway.getClient().getCertificateAuthority();
 const adminIdentity = gateway.getCurrentIdentity();

  // Register the user, enroll the user, and import the new identity into the wallet.
  const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: username, role: 'client' }, adminIdentity);
  const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret });
  const userIdentity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
  wallet.import(username, userIdentity);
  console.log('Successfully registered and enrolled admin user \"', username, '\" and imported it into the wallet');
  return userIdentity;
}
catch(error){
console.log(`Failed to register user \"`, username, `\": ${error}`);
}

 }


 async registerSensor(username, channel, smartcontract, iot){
try{
     // Create a new file system based wallet for managing identities.
     const walletPath = path.join(process.cwd(), 'wallet');
     const wallet = new FileSystemWallet(walletPath);
     console.log(`Wallet path: ${walletPath}`);

     const userExists=await wallet.exists(username);
     if (!userExists) {
        console.log('Invalid user \"', username, '\" ');
        console.log('Run the registerUser.js application before retrying');
        return;
    }
    //creating a new gateway to connect to peer node
    //gateway class is provided by HLF to connect to the network
    const gateway=new gateway();
    await gateway.connect(ccp,{wallet,identity:username,discovery:{enabled:false}});
    const network=gateway.getNetwork(channel);
    const contract=network.getContract(smartcontract);
    await contract.submitTransaction('registerSensor', iot.sensorID);
    //disconnect from the gateway
    await gateway.disconnect();
    return 'Sensor registered'
} catch(error){

    console.error(`Failed to submit transaction: ${error}`);
    
}
 }



 async addTemptoContract(username, channel, smartcontract, iot){
try{//file system based wallet to manage identitites
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
//checking if user exists
    const userExists=await wallet.exists(username);
    if (!userExists) {
       console.log('Invalid user \"', username, '\" ');
       console.log('Run the registerUser.js application before retrying');
       return;
   }   
    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: username, discovery: { enabled: false } });
    const network=gateway.getNetwork(channel);
    const contract=network.getContract(smartcontract);
    await contract.submitTransaction('Temperature',{"sensor ID":iot.sensorID,
"temperature":iot.temp, "Time":iot.time });

await gateway.disconnect();
console.log("Temperature data has been added to network");
process.exit(1);
} catch(error){
console.log(`failed to add temperature data ${error}`);
}
 }


 async getData(username, channel, smartcontract, iot){
    try {
    
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(username);
        if (!userExists) {
            console.log('An identity for the user \"', username, '\" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: username, discovery: { enabled: false } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channel);

        // Get the contract from the network.
        const contract = network.getContract(smartcontract);

        const result = await contract.evaluateTransaction('getHistory', iot.sensorID);
        console.log(`Temperature recorded by sensor ${iot.sensorID}: ${result.toString()}`);
        return result.toString();
        //time based search function

        //graph of temperature variation
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}
 }






module.exports=fabricContracts;