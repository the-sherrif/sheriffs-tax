const REF_KEY = "sheriffs_tax_referrer";
const DEPUTY_KEY = "sheriffs_tax_deputy_id";
const COPY_KEY = "sheriffs_tax_referral_copies";

const $ = (id) => document.getElementById(id);

function makeDeputyId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "D";
  for (let i = 0; i < 7; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function getOrCreateDeputyId() {
  let id = localStorage.getItem(DEPUTY_KEY);
  if (!id) {
    id = makeDeputyId();
    localStorage.setItem(DEPUTY_KEY, id);
  }
  return id;
}

function getReferrer() {
  const params = new URLSearchParams(window.location.search);
  const incoming = params.get("ref");

  if (incoming && incoming.length <= 120) {
    localStorage.setItem(REF_KEY, incoming);
    return incoming;
  }

  return localStorage.getItem(REF_KEY);
}

function getDeputyLink() {
  return `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(getOrCreateDeputyId())}`;
}

function renderDeputy() {
  const id = getOrCreateDeputyId();
  const referrer = getReferrer();
  const linkBox = $("refBox");
  const deputyId = $("deputyId");
  const notice = $("refNotice");
  const noticeText = $("refNoticeText");
  const copyCount = $("copyCount");

  if (deputyId) deputyId.textContent = id;
  if (linkBox) linkBox.textContent = getDeputyLink();

  if (copyCount) {
    copyCount.textContent = localStorage.getItem(COPY_KEY) || "0";
  }

  if (notice && noticeText) {
    if (referrer && referrer !== id) {
      notice.hidden = false;
      noticeText.textContent =
        `YOU WERE DEPUTIZED BY ${referrer}. YOUR REFERRAL WILL BE RECOGNIZED WHEN THE LIVE PAYMENT SYSTEM IS CONNECTED.`;
    } else {
      notice.hidden = true;
    }
  }
}

async function copyDeputyLink() {
  const button = $("copyRef");
  const link = getDeputyLink();

  try {
    await navigator.clipboard.writeText(link);

    const count = Number(localStorage.getItem(COPY_KEY) || 0) + 1;
    localStorage.setItem(COPY_KEY, String(count));

    if ($("copyCount")) $("copyCount").textContent = count;
    if (button) button.textContent = "COPIED — FIND AN OUTLAW";

    setTimeout(() => {
      if (button) button.textContent = "COPY DEPUTY LINK";
    }, 2200);
  } catch {
    if (button) button.textContent = link;
  }
}

function shareDeputyLink() {
  const link = getDeputyLink();

  if (navigator.share) {
    navigator.share({
      title: "The Sheriff's Tax",
      text: "The Sheriff is collecting taxes. I just got deputized. Your turn.",
      url: link
    }).catch(() => {});
  } else {
    copyDeputyLink();
  }
}

function bindDeputyButtons() {
  $("copyRef")?.addEventListener("click", copyDeputyLink);
  $("shareRef")?.addEventListener("click", shareDeputyLink);
}

renderDeputy();
bindDeputyButtons();
const SHERIFF_TREASURY="0xDfC4b31B8d67074C5fa09197C8FE076eeED0E280";
const CHAIN_ID="0x1237";
const RH_CHAIN={chainId:CHAIN_ID,chainName:"Robinhood Chain",nativeCurrency:{name:"Ether",symbol:"ETH",decimals:18},rpcUrls:["https://rpc.mainnet.chain.robinhood.com"],blockExplorerUrls:["https://robinhoodchain.blockscout.com"]};
const USDG={address:"0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",decimals:6};
const REF_KEY="sheriffs_tax_referrer";
const $=id=>document.getElementById(id);

function status(msg,type=""){const x=$("taxStatus");if(!x)return;x.textContent=msg;x.className="tax-status "+type;x.hidden=false}
function provider(){if(!window.ethereum)throw Error("NO_WALLET");return window.ethereum}
async function network(){const p=provider();if(await p.request({method:"eth_chainId"})===CHAIN_ID)return;try{await p.request({method:"wallet_switchEthereumChain",params:[{chainId:CHAIN_ID}]})}catch(e){if(e.code!==4902)throw e;await p.request({method:"wallet_addEthereumChain",params:[RH_CHAIN]})}}
function amount(v,d){if(!/^\d+(\.\d+)?$/.test(String(v).trim())||Number(v)<=0)throw Error("ENTER A VALID TAX AMOUNT.");const a=String(v).split("."),f=(a[1]||"").padEnd(d,"0").slice(0,d);return BigInt(a[0])*(10n**BigInt(d))+BigInt(f||0)}
async function account(){const p=provider();let a=await p.request({method:"eth_accounts"});if(!a.length){await p.request({method:"eth_requestAccounts"});a=await p.request({method:"eth_accounts"})}if(!a.length)throw Error("CONNECT YOUR WALLET FIRST.");return a[0]}
async function connect(){try{await network();const a=await account();$("walletAddress").textContent=a.slice(0,6)+"..."+a.slice(-4);status("WALLET CONNECTED. SELECT YOUR TAX.","success");$("connectTax").textContent="WALLET CONNECTED"}catch(e){status(e.message==="NO_WALLET"?"NO EVM WALLET DETECTED. OPEN THIS SITE IN YOUR WALLET BROWSER.":e.message||"WALLET CONNECTION FAILED.","error")}}
async function payETH(){try{await network();const from=await account(),v="0x"+amount($("taxAmount").value,18).toString(16);status("CONFIRM THE TAX IN YOUR WALLET. THE SHERIFF IS WAITING.","pending");const tx=await provider().request({method:"eth_sendTransaction",params:[{from,to:SHERIFF_TREASURY,value:v}]});success(tx,"ETH")}catch(e){status(e.message||"ETH PAYMENT FAILED OR WAS REJECTED.","error")}}
async function payUSDG(){try{await network();const from=await account(),v=amount($("taxAmount").value,USDG.decimals);const data="0xa9059cbb"+SHERIFF_TREASURY.slice(2).padStart(64,"0")+v.toString(16).padStart(64,"0");status("CONFIRM THE USDG TAX IN YOUR WALLET. THE SHERIFF IS WAITING.","pending");const tx=await provider().request({method:"eth_sendTransaction",params:[{from,to:USDG.address,data}]});success(tx,"USDG")}catch(e){status(e.message||"USDG PAYMENT FAILED OR WAS REJECTED.","error")}}
function success(tx,asset){status(`TAX PAID IN ${asset}. TRANSACTION SENT. THE SHERIFF HAS YOUR RECEIPT.`,"success");if($("taxTx"))$("taxTx").innerHTML=`<a href="https://robinhoodchain.blockscout.com/tx/${tx}" target="_blank" rel="noopener">VIEW TRANSACTION →</a>`;if($("taxRef"))$("taxRef").textContent=localStorage.getItem(REF_KEY)?`DEPUTY CREDIT: ${localStorage.getItem(REF_KEY)}`:"NO DEPUTY REFERRER DETECTED"}
$("connectTax")?.addEventListener("click",connect);$("payEth")?.addEventListener("click",payETH);$("payUsdg")?.addEventListener("click",payUSDG);
