import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testZimbraSoapAuth() {
  // Artois Zimbra uses first.last@ens.univ-artois.fr usually, but let's test with just the ADE_USERNAME
  const rawUsername = process.env.ADE_USERNAME || "";
  const password = process.env.ADE_PASSWORD || "";
  
  // Format to standard email for Zimbra if needed
  const email = rawUsername.includes('@') ? rawUsername : `${rawUsername}@ens.univ-artois.fr`;

  console.log(`[Zimbra SOAP] Attempting AuthRequest for ${email}...`);

  const requestJson = {
    "Header": {
      "context": {
        "_jsns": "urn:zimbra",
        "userAgent": {
          "name": "ZimbraWebClient"
        }
      }
    },
    "Body": {
      "AuthRequest": {
        "_jsns": "urn:zimbraAccount",
        "account": {
          "by": "name",
          "_content": email
        },
        "password": {
          "_content": password
        }
      }
    }
  };

  try {
    const res = await axios.post('https://wmailetu.univ-artois.fr/service/soap', requestJson, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const body = res.data?.Body;
    if (body?.AuthResponse) {
      console.log("✅ SUCCESS! AuthResponse Received:");
      console.log("Auth Token:", body.AuthResponse.authToken?.[0]?._content);
      console.log("Full Response:", JSON.stringify(body.AuthResponse, null, 2).substring(0, 500));
    } else {
      console.log("❌ Authentication Failed or Unexpected Response:");
      console.log(JSON.stringify(res.data, null, 2));
    }

  } catch (err: any) {
    console.error("Test failed:", err.message);
    if (err.response) {
      console.error(JSON.stringify(err.response.data, null, 2));
    }
  }
}

testZimbraSoapAuth();
