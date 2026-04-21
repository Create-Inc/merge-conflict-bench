<<<<<<< ours
import { GET as telephonyTestGET } from "@/app/api/telephony/test/route";
=======
// Legacy route kept for backwards-compatibility.
>>>>>>> theirs

<<<<<<< ours
export async function GET(request) {
  // Backwards-compatible alias: this route used to be named "twilio/test".
  // We now only support Flagman for telephony.
  return telephonyTestGET(request);
}
=======
export { GET } from "@/app/api/telephony/test/route";
>>>>>>> theirs
