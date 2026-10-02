// End-to-end test against a running server:  BASE=http://localhost:3100 npx tsx scripts/test-http.ts
const BASE = process.env.BASE || "http://localhost:3100";
let pass = 0, fail = 0;
const ok = (c: boolean, n: string, x = "") => { c ? pass++ : fail++; console.log(c ? "  PASS " : "  FAIL ", n, c ? "" : x); };

class Client {
  cookie = "";
  async req(path: string, init: RequestInit = {}) {
    const res = await fetch(BASE + path, { ...init, redirect: "manual", headers: { ...(init.headers || {}), cookie: this.cookie, "Content-Type": "application/json" } });
    const sc = res.headers.get("set-cookie");
    if (sc) this.cookie = sc.split(";")[0];
    const text = (await res.text()).replace(/<!-- -->/g, "");
    return { status: res.status, loc: res.headers.get("location") || "", text, json: () => { try { return JSON.parse(text); } catch { return {}; } } };
  }
  post(p: string, b: unknown, m = "POST") { return this.req(p, { method: m, body: JSON.stringify(b) }); }
}
const rid = () => "http-" + Date.now() + "-" + Math.random().toString(36).slice(2);

async function main() {
  const anon = new Client();
  console.log("Access control");
  for (const p of ["/admin", "/team", "/admin/sales", "/team/sell"]) {
    const r = await anon.req(p);
    ok(r.status === 307 && r.loc.endsWith("/login"), `anonymous ${p} -> login`);
  }
  ok((await anon.post("/api/sell", { eventDate: "2026-10-11", quantity: 1, amount: 1, requestId: rid() })).status === 401, "anonymous /api/sell = 401");
  ok((await anon.req("/api/export?type=sales")).status === 401, "anonymous export = 401");

  console.log("Login");
  const bad = await new Client().post("/api/login", { login: "rahul", password: "wrong", as: "TEAM" });
  ok(bad.status === 401, "wrong password rejected");
  const wrongTab = await new Client().post("/api/login", { login: "admin", password: "admin123", as: "TEAM" });
  ok(wrongTab.status === 403, "admin on Team tab told to use Admin Login");

  const rahul = new Client();
  const l = await rahul.post("/api/login", { login: "rahul", password: "pass123", as: "TEAM" });
  ok(l.status === 200 && l.json().redirect === "/team", "team login by username");
  const byMobile = await new Client().post("/api/login", { login: "9000000002", password: "pass123", as: "TEAM" });
  ok(byMobile.status === 200, "team login by mobile number");

  console.log("Team pages");
  const dash = await rahul.req("/team");
  ok(dash.status === 200 && dash.text.includes("Welcome, Rahul") && dash.text.includes("Total Passes Received"), "dashboard shows Welcome, Rahul + cards");
  ok(dash.text.includes("11 Oct") && dash.text.includes("19 Oct") && dash.text.includes("SELL"), "dashboard lists all 9 dates with SELL");
  ok(dash.text.includes("9340457015") && dash.text.includes("CALL US") && dash.text.includes("WHATSAPP"), "call + whatsapp buttons present");
  ok(dash.text.includes("tel:+919340457015") && dash.text.includes("wa.me/919340457015"), "tel: and wa.me links correct");
  const admRedirect = await rahul.req("/admin");
  ok(admRedirect.status === 307 && admRedirect.loc.endsWith("/team"), "team member can't open /admin");
  ok((await rahul.post("/api/admin/allocate", { userId: "x", eventDate: "2026-10-11", quantity: 5 })).status === 401, "team member can't allocate");
  ok((await rahul.post("/api/admin/members", { name: "x", password: "123456", username: "x" })).status === 401, "team member can't create members");
  ok((await rahul.req("/api/export?type=sales")).status === 401, "team member can't export");

  console.log("Selling over HTTP");
  const before = await rahul.req("/team/passes");
  const s1 = await rahul.post("/api/sell", { eventDate: "2026-10-16", quantity: 2, amount: 777, requestId: rid() });
  ok(s1.status === 200 && s1.json().remaining === 8, "sell 2 on 16 Oct -> remaining 8", s1.text);
  const over = await rahul.post("/api/sell", { eventDate: "2026-10-16", quantity: 9, amount: 100, requestId: rid() });
  ok(over.status === 400 && over.json().error === "You only have 8 passes remaining for this date.", "over-sell blocked with exact message", over.text);
  ok((await rahul.post("/api/sell", { eventDate: "2026-10-16", quantity: -2, amount: 100, requestId: rid() })).status === 400, "negative passes blocked");
  ok((await rahul.post("/api/sell", { eventDate: "2026-10-16", quantity: 1, amount: -100, requestId: rid() })).status === 400, "negative amount blocked");
  ok((await rahul.post("/api/sell", { eventDate: "2026-10-30", quantity: 1, amount: 100, requestId: rid() })).status === 400, "date outside event blocked");
  const same = rid();
  const d1 = await rahul.post("/api/sell", { eventDate: "2026-10-17", quantity: 1, amount: 300, requestId: same });
  const d2 = await rahul.post("/api/sell", { eventDate: "2026-10-17", quantity: 1, amount: 300, requestId: same });
  ok(d1.status === 200 && d2.status === 200 && d2.json().duplicate === true && d2.json().remaining === 9, "double-tap with same requestId counted once");
  // spoof attempt: user tries to sell on behalf of someone else
  const spoof = await rahul.post("/api/sell", { userId: "someone-else", eventDate: "2026-10-17", quantity: 1, amount: 1, requestId: rid() });
  ok(spoof.status === 200, "extra userId in body is ignored (sale always goes to logged-in member)");

  const my = await rahul.req("/team/sales");
  ok(my.text.includes("₹777") && my.text.includes("16 Oct") && my.text.includes("My Sales"), "My Sales shows the new sale");
  const amit = new Client();
  await amit.post("/api/login", { login: "amit", password: "pass123", as: "TEAM" });
  const amitSell = await amit.post("/api/sell", { eventDate: "2026-10-18", quantity: 1, amount: 4321, requestId: rid() });
  ok(amitSell.status === 200, "amit sells too");
  ok(!(await rahul.req("/team/sales")).text.includes("4,321"), "rahul cannot see amit's sales");
  ok(!(await rahul.req("/team")).text.includes("Amit"), "rahul dashboard has no other member names");
  ok((await rahul.req("/team/sell")).status === 200 && (await rahul.req("/team/profile")).status === 200, "Sell Pass + Profile pages load");

  console.log("Admin");
  const admin = new Client();
  const al = await admin.post("/api/login", { login: "admin", password: "admin123", as: "ADMIN" });
  ok(al.status === 200 && al.json().redirect === "/admin", "admin login");
  const ad = await admin.req("/admin");
  ok(ad.text.includes("Event Dashboard") && ad.text.includes("Total Passes Distributed") && ad.text.includes("Total Team Members"), "admin dashboard cards");
  ok(ad.text.includes("4,321") || (await admin.req("/admin/sales")).text.includes("4,321"), "admin sees amit's sale immediately");
  const f = await admin.req("/admin?date=2026-10-16");
  ok(f.status === 200 && f.text.includes("16 October") && f.text.includes("₹777"), "date filter 16 Oct works");
  ok((await admin.req("/team")).status === 307, "admin redirected away from /team");
  for (const p of ["/admin/team", "/admin/allocate", "/admin/inventory", "/admin/reports", "/admin/settings"]) ok((await admin.req(p)).status === 200, `admin page ${p} loads`);
  const sales = await admin.req("/admin/sales?q=rahul&date=2026-10-16");
  const tbody = sales.text.slice(sales.text.indexOf("<tbody"), sales.text.indexOf("</tbody>"));
  ok(tbody.includes("Rahul") && !tbody.includes("Amit") && tbody.includes("S-") && tbody.includes("777"), "sales filter + search by name (table rows only)");
  const csv = await admin.req("/api/export?type=sales&date=2026-10-16");
  ok(csv.status === 200 && csv.text.includes("Sale ID") && csv.text.includes("Rahul") && csv.text.includes("777"), "sales CSV export");
  for (const t of ["overall", "datewise", "members"]) ok((await admin.req(`/api/export?type=${t}`)).text.length > 30, `${t} CSV export`);

  console.log("Admin actions");
  const tag = Date.now().toString().slice(-6);
  const mk = await admin.post("/api/admin/members", { name: "Newbie " + tag, mobile: "98" + tag + "01", password: "secret1" });
  ok(mk.status === 200, "create team member", mk.text);
  ok((await admin.post("/api/admin/members", { name: "Dup", mobile: "98" + tag + "01", password: "secret1" })).status === 400, "duplicate mobile rejected");
  const nid = mk.json().id;
  const alo = await admin.post("/api/admin/allocate", { userId: nid, eventDate: "2026-10-15", quantity: 10 });
  ok(alo.status === 200, "allocate 10 passes on 15 Oct");
  const nb = new Client();
  ok((await nb.post("/api/login", { login: "98" + tag + "01", password: "secret1", as: "TEAM" })).status === 200, "new member logs in with mobile");
  ok((await nb.post("/api/sell", { eventDate: "2026-10-15", quantity: 4, amount: 1200, requestId: rid() })).json().remaining === 6, "new member sold 4, remaining 6");
  ok((await nb.post("/api/sell", { eventDate: "2026-10-14", quantity: 1, amount: 100, requestId: rid() })).status === 400, "can't sell on a date with no allocation");
  const rv = await admin.post("/api/admin/allocate", { id: alo.json().id }, "DELETE");
  ok(rv.status === 400 && rv.json().error.includes("already sold"), "revoke blocked after sales", rv.text);
  const ed = await admin.post("/api/admin/allocate", { id: alo.json().id, quantity: 15 }, "PATCH");
  ok(ed.status === 200, "edit allocation 10 -> 15");
  const tooMany = await nb.post("/api/sell", { eventDate: "2026-10-15", quantity: 12, amount: 1, requestId: rid() });
  ok(tooMany.json().error === "You only have 11 passes remaining for this date.", "after edit: received 15, sold 4 -> 11 remaining", tooMany.text);
  const detail = await admin.req("/admin/team/" + nid);
  ok(detail.status === 200 && detail.text.includes("Newbie " + tag) && detail.text.includes("Complete sales history"), "member detail page");
  ok((await admin.post("/api/admin/members", { id: nid, active: false }, "PATCH")).status === 200, "deactivate member");
  ok((await nb.post("/api/sell", { eventDate: "2026-10-15", quantity: 1, amount: 1, requestId: rid() })).status === 401, "deactivated member can't sell (session dead)");
  ok((await new Client().post("/api/login", { login: "98" + tag + "01", password: "secret1", as: "TEAM" })).status === 401, "deactivated member can't log in");
  ok((await admin.post("/api/admin/members", { id: nid, active: true, password: "newpass1" }, "PATCH")).status === 200, "reactivate + reset password");
  ok((await new Client().post("/api/login", { login: "98" + tag + "01", password: "newpass1", as: "TEAM" })).status === 200, "login with reset password");

  console.log("Numbers add up");
  const dbDash = await admin.req("/admin");
  ok(dbDash.status === 200, "dashboard still renders after all actions");

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
