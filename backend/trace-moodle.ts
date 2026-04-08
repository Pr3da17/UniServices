import { CasClient } from './src/utils/casClient.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function traceMoodle() {
  const username = process.env.ADE_USERNAME;
  const password = process.env.ADE_PASSWORD;

  const cas = new CasClient();
  await cas.login(username!, password!);
  
  const moodleLoginUrl = "https://moodle.univ-artois.fr/login/index.php";
  const ticketUrlWithST = await cas.getServiceTicket(moodleLoginUrl);
  
  // @ts-ignore
  const moodleRes = await cas.axiosInstance.get(ticketUrlWithST, {
      maxRedirects: 5,
      validateStatus: () => true
  });
  
  console.log("Landed on:", moodleRes.config.url);
  console.log("Status:", moodleRes.status);
  
  const bodyText = moodleRes.data;
  const sesskeyMatch = bodyText.match(/"sesskey":"([^"]+)"/);
  console.log("Found Sesskey:", sesskeyMatch ? sesskeyMatch[1] : "NONE");
  
  // also check other ways sesskey is embedded
  const logoutMatch = bodyText.match(/sesskey=([^"&]+)/);
  console.log("Found Sesskey via logout link:", logoutMatch ? logoutMatch[1] : "NONE");
  
  if (!sesskeyMatch && !logoutMatch) {
      console.log("HTML Preview:", bodyText.substring(0, 1500));
  }
}

traceMoodle();
