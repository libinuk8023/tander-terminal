"use client";

import AICoreGlobe from "@/components/AICoreGlobe";
import SignalMonitor from "@/components/SignalMonitor";
import { useEffect, useMemo, useState } from "react";
import HeaderLogo from "@/components/HeaderLogo";
import TopMarketStrip from "@/components/TopMarketStrip";
import EarthCoreV3 from "@/components/EarthCoreV3";

/* =========================
   数据类型
========================= */
type FeedItem={id:number;time:string;publishedAt?:string;hasKnownTime?:boolean;source:string;title:string;summary:string;importance:"高"|"中";url:string;tags?:string[];isFavorite?:boolean;sortTs?:number;};
type FeedResponse={page?:number;pageSize?:number;total?:number;totalPages?:number;items?:FeedItem[];};
type SearchResponse={query:string;results:FeedItem[];};
type SignalItem={name:string;price:string;change:string;cls:"up"|"down";points:string;};
type SparkSeries={name:string;price:string;change:string;cls:"up"|"down";values:number[];};
type LogItem={id:number;text:string;level:"normal"|"warn"|"alert";time:string;};
type MacroEventItem={id:number;time:string;country:string;event:string;previous:string;forecast:string;actual:string;impact:"高"|"中"|"低";status:"已公布"|"待公布"|"进行中";};
type RiskItem={label:string;value:string;tone:"up"|"down"|"neutral";};
type MacroBoardItem={name:string;latest:string;previous:string;status:string;};

/* =========================
   常量
========================= */
const menuItems=["实时情报","头条精选","宏观数据","中国市场","美股科技","加密雷达","AI晨报","AI洞察","我的收藏"] as const;
const topChannels=["实时情报","宏观数据","中国市场","全球市场","AI情报","加密板块","风险雷达","中国板块"] as const;
const PAGE_SIZE=15;
const MAX_PAGES=15;
const FEED_FETCH_SIZE=PAGE_SIZE*MAX_PAGES;
const chinaOnlySources=["同花顺","财联社","华尔街见闻","新浪财经","央视新闻","CCTV News"];
const cryptoSources=["CoinDesk","律动 BlockBeats","BlockBeats","金十"];

const INITIAL_SIGNALS:SignalItem[]=[
  {name:"NASDAQ 100",price:"21,180",change:"+1.26%",cls:"up",points:"2,18 10,17 18,16 26,15 34,12 42,13 50,10 58,8 68,7"},
  {name:"BTC",price:"86,420",change:"-0.82%",cls:"down",points:"2,8 10,9 18,11 26,10 34,13 42,15 50,14 58,17 68,18"},
  {name:"Gold",price:"2,148",change:"+0.43%",cls:"up",points:"2,19 10,18 18,17 26,15 34,14 42,12 50,11 58,9 68,8"},
  {name:"DXY",price:"103.8",change:"+0.18%",cls:"up",points:"2,17 10,16 18,16 26,14 34,13 42,12 50,11 58,9 68,8"},
];

const INITIAL_PAGES:Record<string,number>={实时情报:1,头条精选:1,宏观数据:1,中国市场:1,美股科技:1,加密雷达:1,AI晨报:1,AI洞察:1,我的收藏:1};

const INITIAL_SPARKS:SparkSeries[]=[
  {name:"NASDAQ 100",price:"21,199",change:"+1.36%",cls:"up",values:[42,45,48,50,49,54,57,60,63,66,68,72]},
  {name:"BTC",price:"89,459",change:"-0.05%",cls:"down",values:[66,63,67,70,71,69,67,68,66,67,65,64]},
  {name:"Gold",price:"2,145",change:"+0.49%",cls:"up",values:[54,53,52,55,57,56,58,57,59,61,60,62]},
  {name:"DXY",price:"103.8",change:"+3.15%",cls:"up",values:[35,37,36,39,41,43,44,46,47,50,52,54]},
];

const LOG_POOL=[
  {text:"UNUSUAL NETWORK TRAFFIC DETECTED [NODE:A5]",level:"alert" as const},
  {text:"SEC_DATA_FEED SYNC [FEED_76]",level:"normal" as const},
  {text:"BACKGROUND_METADATA_TRAFFIC_DETECTED",level:"normal" as const},
  {text:"CONNECTION ESTABLISHED [ROUTER_X1]",level:"warn" as const},
  {text:"THREAT_VECTOR_UPDATE [APT-38]",level:"alert" as const},
  {text:"API_GATEWAY TOKEN REFRESH [EDGE-09]",level:"normal" as const},
  {text:"CROSS_REGION PACKET LOSS SPIKE [EU-NODE]",level:"warn" as const},
  {text:"ENCRYPTION HANDSHAKE COMPLETED [TLS-1.3]",level:"normal" as const},
];

/* =========================
   宏观假数据
========================= */
const MACRO_EVENTS:MacroEventItem[]=[
  {id:1,time:"07:00",country:"UK",event:"GDP MoM",previous:"-0.1%",forecast:"0.2%",actual:"待公布",impact:"中",status:"待公布"},
  {id:2,time:"10:00",country:"EU",event:"ZEW Economic Sentiment",previous:"24.2",forecast:"26.8",actual:"进行中",impact:"中",status:"进行中"},
  {id:3,time:"12:30",country:"US",event:"CPI YoY",previous:"3.1%",forecast:"3.2%",actual:"待公布",impact:"高",status:"待公布"},
  {id:4,time:"12:30",country:"US",event:"Core CPI MoM",previous:"0.3%",forecast:"0.3%",actual:"待公布",impact:"高",status:"待公布"},
  {id:5,time:"18:00",country:"US",event:"10Y Bond Auction",previous:"4.31%",forecast:"4.28%",actual:"待公布",impact:"中",status:"待公布"},
  {id:6,time:"19:00",country:"US",event:"FOMC Member Speech",previous:"-",forecast:"-",actual:"-",impact:"中",status:"待公布"},
];

const MACRO_RISK_PANEL:RiskItem[]=[
  {label:"Dollar Strength",value:"偏强",tone:"up"},
  {label:"Rate Cut Expectation",value:"降温",tone:"down"},
  {label:"Gold Safe Haven",value:"抬升",tone:"up"},
  {label:"Risk Appetite",value:"中性偏弱",tone:"neutral"},
];

const MACRO_BOARD:MacroBoardItem[]=[
  {name:"US CPI YoY",latest:"3.2%",previous:"3.1%",status:"待公布"},
  {name:"US Core CPI MoM",latest:"0.3%",previous:"0.3%",status:"待公布"},
  {name:"US NFP",latest:"275K",previous:"229K",status:"已公布"},
  {name:"US Unemployment Rate",latest:"3.9%",previous:"3.7%",status:"已公布"},
  {name:"Fed Funds Rate",latest:"5.25%-5.50%",previous:"5.25%-5.50%",status:"维持"},
  {name:"ECB Deposit Rate",latest:"4.00%",previous:"4.00%",status:"维持"},
];

/* =========================
   工具函数
========================= */
function pad2(n:number){return String(n).padStart(2,"0");}
function timeLabel(d=new Date()){return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;}
function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n));}

function getSourceStyle(source:string){
  const s=source.toLowerCase();
  if(s.includes("coindesk")) return {background:"rgba(139,92,246,0.18)",color:"#c4b5fd",border:"1px solid rgba(139,92,246,0.35)"};
  if(s.includes("blockbeats")||source.includes("律动")) return {background:"rgba(236,72,153,0.16)",color:"#f9a8d4",border:"1px solid rgba(236,72,153,0.32)"};
  if(s.includes("jin10")||source.includes("金十")) return {background:"rgba(245,158,11,0.16)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.3)"};
  if(source.includes("同花顺")||source.includes("财联社")||source.includes("华尔街见闻")||source.includes("新浪财经")||source.includes("央视新闻")||source.includes("CCTV")) {
    return {background:"rgba(34,197,94,0.16)",color:"#86efac",border:"1px solid rgba(34,197,94,0.32)"};
  }
  return {background:"rgba(59,130,246,0.14)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)"};
}

function getTagStyle(tag:string){
  if(tag==="加密") return {background:"rgba(168,85,247,0.16)",color:"#d8b4fe",border:"1px solid rgba(168,85,247,0.3)"};
  if(tag==="宏观") return {background:"rgba(245,158,11,0.16)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.3)"};
  if(tag==="中国市场"||tag==="财经") return {background:"rgba(34,197,94,0.16)",color:"#86efac",border:"1px solid rgba(34,197,94,0.3)"};
  if(tag==="美股") return {background:"rgba(59,130,246,0.16)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)"};
  if(tag==="AI") return {background:"rgba(6,182,212,0.16)",color:"#67e8f9",border:"1px solid rgba(6,182,212,0.3)"};
  return {background:"rgba(148,163,184,0.14)",color:"#cbd5e1",border:"1px solid rgba(148,163,184,0.24)"};
}

function timeTextToSortTs(timeText?:string){
  if(!timeText||!/^\d{1,2}:\d{2}$/.test(timeText)) return 0;
  const now=new Date();
  const [hh,mm]=timeText.split(":").map(Number);
  const d=new Date(now);
  d.setHours(hh,mm,0,0);
  if(d.getTime()-now.getTime()>5*60*1000) d.setDate(d.getDate()-1);
  return d.getTime();
}

function buildSortTs(publishedAt?:string,timeText?:string,index=0){
  if(publishedAt){
    const ts=new Date(publishedAt).getTime();
    if(!Number.isNaN(ts)) return ts;
  }
  const textTs=timeTextToSortTs(timeText);
  if(textTs>0) return textTs-index;
  return Date.now()-10_000_000_000-index;
}

function paginate<T>(items:T[],page:number){
  const limited=items.slice(0,FEED_FETCH_SIZE);
  const totalItems=limited.length;
  const totalPages=Math.max(1,Math.min(MAX_PAGES,Math.ceil(totalItems/PAGE_SIZE)));
  const safePage=Math.min(Math.max(1,page),totalPages);
  const start=(safePage-1)*PAGE_SIZE;
  return {items:limited.slice(start,start+PAGE_SIZE),totalItems,totalPages,page:safePage};
}

function sortFeedItems(items:FeedItem[]){
  return [...items].sort((a,b)=>{
    const ta=a.sortTs||0;
    const tb=b.sortTs||0;
    if(ta!==tb) return tb-ta;
    const ia=a.importance==="高"?1:0;
    const ib=b.importance==="高"?1:0;
    if(ia!==ib) return ib-ia;
    return a.source.localeCompare(b.source);
  });
}

function toPoints(values:number[],width=104,height=28){
  if(values.length===0) return "";
  const max=Math.max(...values);
  const min=Math.min(...values);
  const range=Math.max(1,max-min);
  return values.map((v,i)=>{
    const x=(i/(values.length-1||1))*width;
    const y=height-((v-min)/range)*height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function makeLog(id:number):LogItem{
  const entry=LOG_POOL[id%LOG_POOL.length];
  return {id,text:entry.text,level:entry.level,time:timeLabel()};
}

function getImpactClass(impact:MacroEventItem["impact"]){if(impact==="高") return "high"; if(impact==="中") return "mid"; return "low";}
function getStatusClass(status:MacroEventItem["status"]){if(status==="已公布") return "done"; if(status==="进行中") return "live"; return "wait";}
function getRiskToneClass(tone:RiskItem["tone"]){if(tone==="up") return "up"; if(tone==="down") return "down"; return "neutral";}

/* =========================
   小组件
========================= */
function ShieldLogo(){
  return(
    <div className="terminal-logo-wrap" aria-hidden="true">
      <div className="terminal-logo-core">
        <svg viewBox="0 0 120 132" className="terminal-logo-svg">
          <defs>
            <linearGradient id="shieldTechGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f4fdff"/><stop offset="35%" stopColor="#9befff"/><stop offset="70%" stopColor="#51e3ff"/><stop offset="100%" stopColor="#118bc2"/></linearGradient>
            <linearGradient id="shieldFrameGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="rgba(170,245,255,0.95)"/><stop offset="100%" stopColor="rgba(81,227,255,0.35)"/></linearGradient>
            <linearGradient id="shieldHolo" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stopColor="#51e3ff" stopOpacity="0.16"/><stop offset="100%" stopColor="#51e3ff" stopOpacity="0.03"/></linearGradient>
            <radialGradient id="shieldPulseCore" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.95"/><stop offset="35%" stopColor="#9befff" stopOpacity="0.88"/><stop offset="70%" stopColor="#51e3ff" stopOpacity="0.26"/><stop offset="100%" stopColor="#51e3ff" stopOpacity="0"/></radialGradient>
          </defs>
          <g className="shield-rotor">
            <circle cx="60" cy="65" r="58" fill="none" stroke="rgba(81,227,255,0.22)" strokeWidth="1.2" strokeDasharray="10 8"/>
            <circle cx="60" cy="65" r="52" fill="none" stroke="rgba(81,227,255,0.12)" strokeWidth="0.9" strokeDasharray="4 10"/>
            <circle cx="60" cy="7" r="2.4" fill="#b8f7ff" className="shield-scan-dot"/>
          </g>
          <path d="M60 6 L109 25 L109 66 C109 96 85 116 60 128 C35 116 11 96 11 66 L11 25 Z" fill="url(#shieldHolo)" stroke="rgba(81,227,255,0.18)" strokeWidth="1.8"/>
          <path d="M60 15 L99 31 L99 65 C99 88 80 105 60 117 C40 105 21 88 21 65 L21 31 Z" fill="none" stroke="url(#shieldFrameGrad)" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M51 13 L60 8 L69 13" fill="none" stroke="#8feeff" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M30 28 L23 33" fill="none" stroke="#67e8ff" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M90 28 L97 33" fill="none" stroke="#67e8ff" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="60" cy="66" r="24" fill="url(#shieldPulseCore)" className="shield-core-pulse"/>
          <path className="shield-t-mark" d="M26 36 H94 L84 52 H70 V96 L60 108 L50 96 V52 H36 Z" fill="none" stroke="url(#shieldTechGrad)" strokeWidth="3.8" strokeLinejoin="round" strokeLinecap="round"/>
          <path d="M36 43 H84" fill="none" stroke="rgba(190,250,255,0.95)" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M60 56 V92" fill="none" stroke="rgba(190,250,255,0.95)" strokeWidth="1.4" strokeLinecap="round"/>
          <g className="shield-circuit-lines">
            <path d="M41 47 H50" stroke="#b8f7ff" strokeWidth="1.35" strokeLinecap="round" opacity="0.98"/>
            <circle cx="53" cy="47" r="1.45" fill="#9befff"/>
            <path d="M79 47 H70" stroke="#b8f7ff" strokeWidth="1.35" strokeLinecap="round" opacity="0.98"/>
            <circle cx="67" cy="47" r="1.45" fill="#9befff"/>
            <path d="M60 62 V86" stroke="#c8fbff" strokeWidth="1.55" strokeLinecap="round" opacity="0.96"/>
            <circle cx="60" cy="69" r="1.5" fill="#eafcff"/>
            <circle cx="60" cy="77" r="1.5" fill="#8feeff"/>
            <circle cx="60" cy="84" r="1.35" fill="#67e8ff"/>
            <path d="M60 69 H54" stroke="#8feeff" strokeWidth="1.1" strokeLinecap="round" opacity="0.92"/>
            <path d="M60 77 H66" stroke="#8feeff" strokeWidth="1.1" strokeLinecap="round" opacity="0.92"/>
          </g>
          <circle cx="60" cy="118" r="2.1" fill="#8feeff" opacity="0.9"/>
        </svg>
      </div>
    </div>
  );
}

function ThreatMapPanel(){
  return(
    <div className="terminal-threat-card">
      <div className="terminal-card-head"><span>CYBER THREAT INTELLIGENCE FEED</span></div>
      <svg viewBox="0 0 420 220" className="terminal-threat-map" aria-hidden="true">
        <defs>
          <linearGradient id="attackRed" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="rgba(255,111,145,.9)"/><stop offset="100%" stopColor="rgba(255,95,95,.35)"/></linearGradient>
          <linearGradient id="attackBlue" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="rgba(109,220,255,.9)"/><stop offset="100%" stopColor="rgba(109,220,255,.2)"/></linearGradient>
        </defs>
        <path className="wm-continent" d="M33 95 L68 77 L108 81 L124 92 L138 96 L153 88 L170 91 L182 104 L182 117 L170 124 L150 126 L133 122 L122 113 L111 112 L104 118 L91 125 L81 124 L73 117 L62 111 L50 107 L39 100 Z"/>
        <path className="wm-continent" d="M130 133 L145 137 L157 153 L147 178 L138 188 L127 182 L126 170 L120 155 Z"/>
        <path className="wm-continent" d="M204 82 L221 74 L244 73 L263 77 L282 84 L303 86 L319 98 L320 111 L305 121 L286 121 L273 117 L260 116 L250 111 L237 110 L226 103 L214 99 L206 90 Z"/>
        <path className="wm-continent" d="M240 119 L255 128 L259 143 L251 155 L238 157 L228 147 L230 131 Z"/>
        <path className="wm-continent" d="M317 135 L333 132 L351 141 L364 159 L356 173 L338 172 L323 162 L313 147 Z"/>
        <path className="wm-link red" d="M78 92 C126 88, 174 92, 228 94"/>
        <path className="wm-link red delay-b" d="M78 92 C118 104, 150 122, 143 162"/>
        <path className="wm-link red delay-c" d="M78 92 C185 48, 280 72, 336 149"/>
        <path className="wm-link blue" d="M228 94 C270 102, 308 116, 336 149"/>
        <path className="wm-link blue delay-b" d="M228 94 C244 101, 241 122, 244 148"/>
        <path className="wm-link blue delay-c" d="M228 94 C282 87, 333 92, 370 156"/>
        <circle className="wm-node wm-hot" cx="78" cy="92" r="5"/>
        <circle className="wm-node wm-hot" cx="143" cy="162" r="4.5"/>
        <circle className="wm-node wm-hot" cx="228" cy="94" r="5.5"/>
        <circle className="wm-node wm-cold" cx="336" cy="149" r="4.5"/>
        <circle className="wm-node wm-cold" cx="370" cy="156" r="4"/>
        <circle className="wm-node wm-cold" cx="244" cy="148" r="4"/>
      </svg>
      <div className="terminal-threat-vectors">
        <div className="terminal-vectors-title">Current Threat Vectors</div>
        <div className="terminal-vector alert">[APT:28] /TARGET: FIN_SERVER_03 /STATUS: IN PROGRESS</div>
        <div className="terminal-vector warn">[APT:39] /TARGET: CLOUD_NODE_12 /STATUS: IN PROGRESS</div>
        <div className="terminal-vector normal">[APT:33] /TARGET: DATA_HUB_08 /STATUS: MONITORING</div>
      </div>
    </div>
  );
}

function TerminalWorldCard(){
  return(
    <div className="terminal-world-card">
      <div className="terminal-card-head"><span>GLOBAL NODE MAP</span><span>LIVE</span></div>
      <svg viewBox="0 0 420 180" className="terminal-world-svg" aria-hidden="true">
        <defs><linearGradient id="worldLine" x1="0" x2="1"><stop offset="0%" stopColor="#66e3ff" stopOpacity="0.1"/><stop offset="50%" stopColor="#7be7ff" stopOpacity="0.95"/><stop offset="100%" stopColor="#9dd9ff" stopOpacity="0.15"/></linearGradient></defs>
        <path className="tw-continent" d="M24 72 L78 48 L126 56 L138 78 L116 102 L76 100 L42 88 Z"/>
        <path className="tw-continent" d="M156 56 L208 44 L266 50 L314 74 L300 104 L242 108 L186 92 Z"/>
        <path className="tw-continent" d="M300 116 L340 108 L372 124 L392 146 L374 164 L334 158 L312 138 Z"/>
        <path className="tw-link" d="M86 66 C132 48, 178 52, 220 68"/>
        <path className="tw-link" d="M220 68 C252 76, 300 92, 346 136"/>
        <path className="tw-link" d="M220 68 C204 94, 190 118, 178 140"/>
        <circle className="tw-node hot" cx="86" cy="66" r="4"/>
        <circle className="tw-node" cx="220" cy="68" r="4"/>
        <circle className="tw-node" cx="346" cy="136" r="4"/>
        <circle className="tw-node" cx="178" cy="140" r="4"/>
      </svg>
    </div>
  );
}

function SystemLogPanel({logs}:{logs:LogItem[]}) {
  return(
    <div className="terminal-log-card">
      <div className="terminal-card-head"><span>SYSTEM ACTIVITY LOG</span></div>
      <div className="terminal-log-list">
        {logs.map((item)=>(
          <div className="terminal-log-row" key={item.id}>
            <span className="terminal-log-time">[{item.time}]</span>
            <span className="terminal-log-text">{item.text}</span>
            <span className={`terminal-log-level ${item.level}`}>[{item.level==="normal"?"NORMAL":item.level==="warn"?"WARN":"ALERT"}]</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerspectiveHeatmap(){
  return(
    <div className="terminal-heatmap-card">
      <svg viewBox="0 0 900 260" className="terminal-heatmap-svg" aria-hidden="true">
        <defs>
          <linearGradient id="incidentRed" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="rgba(255,107,107,.92)"/><stop offset="100%" stopColor="rgba(255,107,107,.18)"/></linearGradient>
          <linearGradient id="incidentBlue" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="rgba(109,220,255,.9)"/><stop offset="100%" stopColor="rgba(109,220,255,.18)"/></linearGradient>
          <radialGradient id="incidentHot"><stop offset="0%" stopColor="rgba(255,120,120,.95)"/><stop offset="100%" stopColor="rgba(255,120,120,0)"/></radialGradient>
          <radialGradient id="incidentCold"><stop offset="0%" stopColor="rgba(109,220,255,.95)"/><stop offset="100%" stopColor="rgba(109,220,255,0)"/></radialGradient>
          <linearGradient id="incidentSweep" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="rgba(109,220,255,0)"/><stop offset="50%" stopColor="rgba(109,220,255,.18)"/><stop offset="100%" stopColor="rgba(109,220,255,0)"/></linearGradient>
        </defs>
        <rect x="188" y="134" width="520" height="12" rx="6" fill="url(#incidentSweep)" className="heatScan"/>
        {Array.from({length:18}).map((_,i)=><line key={`v-${i}`} className="hm-grid-line" x1={110+i*38} y1={48} x2={80+i*42} y2={232}/>)}
        {Array.from({length:7}).map((_,i)=><line key={`h-${i}`} className="hm-grid-line" x1={80-i*5} y1={72+i*26} x2={820+i*5} y2={72+i*26}/>)}
        <path className="hm-continent" d="M186 132 L244 118 L306 122 L334 138 L362 130 L392 140 L418 160 L414 182 L382 192 L340 188 L314 174 L292 174 L272 186 L238 190 L208 172 L192 156 Z"/>
        <path className="hm-continent" d="M314 184 L340 192 L356 218 L346 240 L322 232 L314 210 Z"/>
        <path className="hm-continent" d="M482 114 L530 106 L582 110 L626 120 L670 132 L714 150 L706 180 L666 188 L626 182 L592 168 L556 164 L526 152 L498 138 Z"/>
        <path className="hm-continent" d="M556 168 L582 186 L590 214 L566 226 L536 214 L530 190 Z"/>
        <path className="hm-continent" d="M716 188 L758 182 L798 202 L826 232 L804 244 L758 236 L730 214 Z"/>
        <path className="incident-link red" d="M270 154 C344 132,420 128,548 160"/>
        <path className="incident-link red delay-b" d="M548 160 C606 154,646 160,688 170"/>
        <path className="incident-link red delay-c" d="M688 170 C730 176,760 192,792 214"/>
        <path className="incident-link blue" d="M346 206 C404 184,468 174,606 164"/>
        <path className="incident-link blue delay-b" d="M606 164 C646 164,670 168,688 170"/>
        <circle cx="270" cy="154" r="18" fill="url(#incidentCold)"/><circle cx="346" cy="206" r="14" fill="url(#incidentHot)" className="heatPulse"/><circle cx="548" cy="160" r="12" fill="url(#incidentCold)"/><circle cx="606" cy="164" r="18" fill="url(#incidentHot)" className="heatPulse"/><circle cx="688" cy="170" r="14" fill="url(#incidentCold)"/><circle cx="792" cy="214" r="12" fill="url(#incidentHot)" className="heatPulse"/>
        <circle cx="270" cy="154" r="3.4" fill="#8feeff"/><circle cx="346" cy="206" r="3.6" fill="#ff9d9d"/><circle cx="548" cy="160" r="3.2" fill="#8feeff"/><circle cx="606" cy="164" r="3.8" fill="#ff9d9d"/><circle cx="688" cy="170" r="3.2" fill="#8feeff"/><circle cx="792" cy="214" r="3.4" fill="#ff9d9d"/>
        <text x="280" y="148" className="incident-label">LONDON</text><text x="356" y="200" className="incident-label hot">DUBAI</text><text x="558" y="154" className="incident-label">BEIJING</text><text x="616" y="158" className="incident-label hot">SHANGHAI</text><text x="698" y="164" className="incident-label">TOKYO</text><text x="734" y="228" className="incident-label hot">NEW YORK</text>
      </svg>
    </div>
  );
}

function TerminalVerticalMonitor(){
  return(
    <div className="terminal-vertical-monitor">
      <div className="terminal-vertical-title">NETWORK TRAFFIC MONITOR</div>
      <div className="terminal-vertical-bars">
        <span style={{height:"42%"}}/><span style={{height:"68%"}}/><span style={{height:"54%"}}/><span style={{height:"81%"}}/><span style={{height:"61%"}}/><span style={{height:"88%"}}/>
      </div>
      <div className="terminal-vertical-meta"><div>PACKET LOSS 0.12%</div><div>UPLINK 21ms</div><div>DOWNLINK 18ms</div></div>
    </div>
  );
}

/* =========================
   宏观页面组件
========================= */
function MacroTrendChart({title,sub,values,up=true}:{title:string;sub:string;values:number[];up?:boolean;}){
  return(
    <div className="macro-chart-card">
      <div className="macro-chart-head">
        <div><div className="macro-card-kicker">{title}</div><div className="macro-card-sub">{sub}</div></div>
        <div className={`macro-chart-bias ${up?"up":"down"}`}>{up?"UPTREND":"DOWNTREND"}</div>
      </div>
      <div className="macro-chart-svg-wrap">
        <svg viewBox="0 0 420 180" className="macro-chart-svg" aria-hidden="true">
          {Array.from({length:6}).map((_,i)=><line key={`h-${i}`} x1="10" y1={20+i*28} x2="410" y2={20+i*28} className="macro-grid-line"/>)}
          {Array.from({length:8}).map((_,i)=><line key={`v-${i}`} x1={20+i*55} y1="18" x2={20+i*55} y2="164" className="macro-grid-line"/>)}
          <polyline fill="none" stroke={up?"#51e3ff":"#ff7a98"} strokeWidth="3" points={values.map((v,i)=>`${20+(i*380)/(values.length-1)},${160-v}`).join(" ")} className="macro-chart-line"/>
        </svg>
      </div>
    </div>
  );
}

function MacroDataPage(){
  return(
    <div className="container macro-layout">
      <section className="macro-main-shell">
        <div className="macro-head">
          <div className="macro-head-left">
            <div className="channel-placeholder-kicker">MACRO INTELLIGENCE</div>
            <h2 className="macro-page-title">宏观数据中心</h2>
            <p className="macro-page-sub">全球高影响经济数据 / 央行事件 / 宏观日历 / 利率预期 / 风险监控</p>
            <div className="macro-pulse-row">
              <div className="macro-pulse-card"><span className="macro-pulse-label">DXY BIAS</span><strong className="text-up">STRONG</strong></div>
              <div className="macro-pulse-card"><span className="macro-pulse-label">FED CUT ODDS</span><strong style={{color:"var(--yellow)"}}>62%</strong></div>
              <div className="macro-pulse-card"><span className="macro-pulse-label">US10Y</span><strong>4.28%</strong></div>
              <div className="macro-pulse-card"><span className="macro-pulse-label">GOLD FLOW</span><strong className="text-up">RISK-OFF</strong></div>
            </div>
          </div>
          <div className="macro-head-right">
            <button className="refresh-btn">SYNC</button>
            <div className="macro-reaction-panel">
              <div className="macro-reaction-head"><span>REACTION MATRIX</span><span>LIVE</span></div>
              <div className="macro-reaction-grid">
                <div className="macro-reaction-item"><span>USD</span><strong className="text-up">偏强</strong></div>
                <div className="macro-reaction-item"><span>GOLD</span><strong className="text-up">支撑</strong></div>
                <div className="macro-reaction-item"><span>NASDAQ</span><strong className="text-down">承压</strong></div>
                <div className="macro-reaction-item"><span>UST</span><strong style={{color:"var(--yellow)"}}>中性偏强</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className="macro-top-grid">
          <div className="macro-focus-card">
            <div className="macro-focus-kicker">TODAY FOCUS</div>
            <div className="macro-focus-title">US CPI RELEASE</div>
            <div className="macro-focus-meta"><span>时间 12:30 UTC</span><span>影响 HIGH</span><span>市场核心 美元 / 美债 / 黄金 / 纳指</span></div>
            <div className="macro-focus-stats">
              <div className="macro-stat-box"><div className="macro-stat-label">PREVIOUS</div><div className="macro-stat-value">3.1%</div></div>
              <div className="macro-stat-box"><div className="macro-stat-label">FORECAST</div><div className="macro-stat-value">3.2%</div></div>
              <div className="macro-stat-box"><div className="macro-stat-label">ACTUAL</div><div className="macro-stat-value waiting">PENDING</div></div>
              <div className="macro-stat-box"><div className="macro-stat-label">COUNTDOWN</div><div className="macro-stat-value">02:18:44</div></div>
            </div>
            <div className="macro-focus-impact">当前市场正在等待今晚美国 CPI 数据确认，若高于预期，美元与美债收益率可能继续偏强；若低于预期，风险资产与降息预期可能重新走强。</div>
          </div>

          <div className="macro-status-card">
            <div className="macro-card-kicker">EVENT STATUS</div>
            <div className="macro-status-row"><span>Macro Feed</span><strong className="up">ONLINE</strong></div>
            <div className="macro-status-row"><span>Risk Mode</span><strong className="down">ELEVATED</strong></div>
            <div className="macro-status-row"><span>Focus Region</span><strong>UNITED STATES</strong></div>
            <div className="macro-status-row"><span>Volatility Window</span><strong>12:30-14:00 UTC</strong></div>
            <div className="macro-status-divider"/>
            <div className="macro-status-block">
              <div className="macro-status-label">Primary Drivers</div>
              <div className="macro-status-tags"><span>Inflation</span><span>Fed Path</span><span>DXY</span><span>UST 10Y</span></div>
            </div>
          </div>
        </div>

        <div className="macro-content-grid">
          <div className="macro-left-column">
            <div className="macro-timeline-card">
              <div className="macro-card-head">
                <div><div className="macro-card-kicker">MACRO EVENT TIMELINE</div><div className="macro-card-sub">全球高影响事件流</div></div>
                <div className="macro-card-badge">LIVE SCHEDULE</div>
              </div>
              <div className="macro-timeline-list">
                {MACRO_EVENTS.map((item)=>(
                  <div className="macro-timeline-row" key={item.id}>
                    <div className="macro-timeline-time">{item.time}</div>
                    <div className="macro-timeline-main">
                      <div className="macro-timeline-title"><span className="macro-country">{item.country}</span><span>{item.event}</span></div>
                      <div className="macro-timeline-meta"><span>前值 {item.previous}</span><span>预期 {item.forecast}</span><span>结果 {item.actual}</span></div>
                    </div>
                    <div className="macro-timeline-side">
                      <span className={`macro-impact-pill ${getImpactClass(item.impact)}`}>{item.impact}</span>
                      <span className={`macro-status-pill ${getStatusClass(item.status)}`}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <section className="macro-chart-grid">
              <MacroTrendChart title="CPI TREND" sub="美国 CPI 近阶段变化模拟" values={[86,80,78,74,70,72,68,64]} up={false}/>
              <MacroTrendChart title="FED RATE EXPECTATION" sub="市场对年内利率路径预期" values={[118,116,112,108,100,92,88,84]} up={false}/>
            </section>

            <section className="macro-board-grid">
              <div className="macro-board-card">
                <div className="macro-card-head">
                  <div><div className="macro-card-kicker">ECONOMIC DATA BOARD</div><div className="macro-card-sub">关键数据总览</div></div>
                  <div className="macro-card-badge">BOARD</div>
                </div>
                <div className="macro-board-table">
                  <div className="macro-board-head"><span>DATA</span><span>LATEST</span><span>PREVIOUS</span><span>STATUS</span></div>
                  {MACRO_BOARD.map((item)=>(
                    <div className="macro-board-row" key={item.name}>
                      <span>{item.name}</span><span>{item.latest}</span><span>{item.previous}</span><span>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="macro-mini-card">
                <div className="macro-card-kicker">MARKET LINKAGE</div>
                <div className="macro-mini-list">
                  <div className="macro-mini-row"><span>DXY</span><strong className="up">103.8</strong></div>
                  <div className="macro-mini-row"><span>US10Y</span><strong className="up">4.28%</strong></div>
                  <div className="macro-mini-row"><span>GOLD</span><strong className="neutral">2148</strong></div>
                  <div className="macro-mini-row"><span>NASDAQ</span><strong className="down">Risk Sensitive</strong></div>
                </div>
              </div>
            </section>
          </div>

          <aside className="macro-right-column">
            <div className="macro-risk-card">
              <div className="macro-card-head"><div><div className="macro-card-kicker">MACRO RISK PANEL</div><div className="macro-card-sub">风险与预期方向</div></div></div>
              <div className="macro-risk-list">
                {MACRO_RISK_PANEL.map((item)=>(
                  <div className="macro-risk-row" key={item.label}><span>{item.label}</span><strong className={getRiskToneClass(item.tone)}>{item.value}</strong></div>
                ))}
              </div>
            </div>

            <div className="macro-panel">
              <div className="macro-panel-head"><div><div className="macro-panel-kicker">ASSET MONITOR</div><h3>资产快照</h3></div><span>STREAM</span></div>
              <div className="macro-mini-asset-list">
                {[
                  {name:"DXY",value:"103.8",change:"+0.18%",cls:"up"},
                  {name:"US10Y",value:"4.28%",change:"-0.06%",cls:"down"},
                  {name:"GOLD",value:"2148",change:"+0.43%",cls:"up"},
                  {name:"WTI",value:"79.6",change:"+0.65%",cls:"up"},
                ].map((item)=>(
                  <div className="macro-mini-asset-row" key={item.name}>
                    <div><div className="macro-mini-asset-name">{item.name}</div><div className="macro-mini-asset-value">{item.value}</div></div>
                    <div className={item.cls==="up"?"text-up":"text-down"}>{item.change}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="macro-panel">
              <div className="macro-panel-head"><div><div className="macro-panel-kicker">MARKET REGIME MATRIX</div><h3>市场状态矩阵</h3></div><span>REGIME</span></div>
              <div className="macro-regime-grid">
                <div className="macro-regime-cell"><span>Inflation</span><strong className="text-down">Sticky</strong></div>
                <div className="macro-regime-cell"><span>Growth</span><strong style={{color:"var(--yellow)"}}>Soft</strong></div>
                <div className="macro-regime-cell"><span>Liquidity</span><strong className="text-up">Stable</strong></div>
                <div className="macro-regime-cell"><span>Policy</span><strong className="text-up">Dovish</strong></div>
                <div className="macro-regime-cell"><span>Volatility</span><strong className="text-down">Elevated</strong></div>
                <div className="macro-regime-cell"><span>USD Bias</span><strong className="text-up">Strong</strong></div>
              </div>
            </div>

            <div className="macro-panel">
              <div className="macro-panel-head"><div><div className="macro-panel-kicker">LIVE INTEL NOTE</div><h3>情报备注</h3></div><span>NOTE</span></div>
              <div className="macro-note-box">当前宏观主线仍围绕：<br/>通胀粘性 / 降息预期修正 / 美元与黄金联动 / 风险偏好再定价。</div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

/* =========================
   主页面
========================= */
export default function HomePage(){
  const [activeMenu,setActiveMenu]=useState("实时情报");
  const [topChannel,setTopChannel]=useState("实时情报");
  const [feed,setFeed]=useState<FeedItem[]>([]);
  const [query,setQuery]=useState("");
  const [searchInput,setSearchInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [searching,setSearching]=useState(false);
  const [refreshing,setRefreshing]=useState(false);

  /* 数据状态 */
  const [signals,setSignals]=useState<SignalItem[]>(INITIAL_SIGNALS);
  const [pages,setPages]=useState<Record<string,number>>(INITIAL_PAGES);
  const [sparks]=useState<SparkSeries[]>(INITIAL_SPARKS);
  const [logs,setLogs]=useState<LogItem[]>([]);

  /* 时间状态 */
const [clockNow,setClockNow]=useState<Date | null>(null);
  /* 常量派生 */
  const currentTitle=activeMenu;

  /* 时钟刷新 */
  useEffect(()=>{
  setClockNow(new Date());
  const timer=setInterval(()=>setClockNow(new Date()),100);
  return ()=>clearInterval(timer);
},[]);

  function formatClockWithMs(date:Date,timeZone:string){
    const parts=new Intl.DateTimeFormat("en-GB",{timeZone,hour:"2-digit",minute:"2-digit",second:"2-digit",fractionalSecondDigits:3,hour12:false}).formatToParts(date);
    const get=(type:string)=>parts.find((p)=>p.type===type)?.value||"00";
    return `${get("hour")}:${get("minute")}:${get("second")}.${get("fractionalSecond")}`;
  }

const londonTime=clockNow?formatClockWithMs(clockNow,"Europe/London"):"--:--:--.---";
const beijingTime=clockNow?formatClockWithMs(clockNow,"Asia/Shanghai"):"--:--:--.---";
const newYorkTime=clockNow?formatClockWithMs(clockNow,"America/New_York"):"--:--:--.---";
  useEffect(()=>{
  setLogs(Array.from({length:7}).map((_,idx)=>makeLog(idx+1)).reverse());
},[]);

  /* 拉取主 feed */
  async function loadMainFeed(showLoader=false){
    try{
      if(showLoader) setLoading(true);
      const res=await fetch(`/api/feed?page=1&pageSize=${FEED_FETCH_SIZE}`,{cache:"no-store"});
      if(!res.ok) return;
      const data:FeedResponse=await res.json();
      setFeed(Array.isArray(data.items)?data.items:[]);
    }catch(error){
      console.error("Failed to load feed:",error);
    }finally{
      if(showLoader) setLoading(false);
    }
  }

  /* 拉取信号 */
  async function loadSignals(){
    try{
      const res=await fetch("/api/signals",{cache:"no-store"});
      if(!res.ok) return;
      const data=await res.json();
      if(Array.isArray(data.signals)) setSignals(data.signals);
    }catch{
      /* 接口缺失时静默 */
    }
  }

  /* 刷新全部 */
  async function refreshAll(){
    try{
      setRefreshing(true);
      if(query.trim()){
        setQuery("");
        setSearchInput("");
      }
      await loadMainFeed(false);
      await loadSignals();
      setPages((prev)=>({...prev,[activeMenu]:1}));
    }finally{
      setRefreshing(false);
    }
  }

  /* 初始加载 + 定时刷新 */
  useEffect(()=>{
    const loadAll=async()=>{await loadMainFeed(true); await loadSignals();};
    loadAll();
    const timer=setInterval(()=>{
      if(!query.trim()) loadMainFeed(false);
      loadSignals();
    },30000);
    return ()=>clearInterval(timer);
  },[query]);

  /* 搜索执行 */
  async function runSearch(value:string){
    const next=value.trim();
    setQuery(value);
    setPages((prev)=>({...prev,[activeMenu]:1}));

    if(!next){
      await loadMainFeed(false);
      return;
    }

    try{
      setSearching(true);
      const res=await fetch(`/api/search?q=${encodeURIComponent(value)}`,{cache:"no-store"});
      if(!res.ok){setFeed([]); return;}
      const data:SearchResponse=await res.json();
      setFeed(Array.isArray(data.results)?data.results:[]);
    }catch(error){
      console.error("Search failed:",error);
      setFeed([]);
    }finally{
      setSearching(false);
    }
  }

  /* 搜索框轻量防抖 */
  useEffect(()=>{
    const timer=setTimeout(()=>{runSearch(searchInput);},260);
    return ()=>clearTimeout(timer);
  },[searchInput]);

  /* 规范化 feed */
  const normalizedFeed=useMemo(()=>{
    return [...feed].map((item,index)=>({...item,tags:item.tags??[],isFavorite:item.isFavorite??false,sortTs:buildSortTs(item.publishedAt,item.time,index)}));
  },[feed]);

  /* 菜单过滤 */
  const displayedFeedAll=useMemo(()=>{
    if(activeMenu==="我的收藏") return sortFeedItems(normalizedFeed.filter((item)=>item.isFavorite));
    if(activeMenu==="实时情报") return sortFeedItems(normalizedFeed);
    if(activeMenu==="头条精选") return sortFeedItems(normalizedFeed.filter((item)=>item.importance==="高"));
    if(activeMenu==="宏观数据") return sortFeedItems(normalizedFeed.filter((item)=>item.tags?.includes("宏观")));
    if(activeMenu==="中国市场") return sortFeedItems(normalizedFeed.filter((item)=>item.tags?.includes("中国市场")||chinaOnlySources.includes(item.source)));
    if(activeMenu==="美股科技") return sortFeedItems(normalizedFeed.filter((item)=>item.tags?.includes("美股")));
    if(activeMenu==="加密雷达") return sortFeedItems(normalizedFeed.filter((item)=>item.tags?.includes("加密")||cryptoSources.includes(item.source)));
    if(activeMenu==="AI晨报") return sortFeedItems(normalizedFeed.filter((item)=>item.tags?.includes("AI")));
    if(activeMenu==="AI洞察") return sortFeedItems(normalizedFeed.filter((item)=>item.tags?.includes("AI")||item.importance==="高"));
    return sortFeedItems(normalizedFeed);
  },[activeMenu,normalizedFeed]);

  /* 分页 */
  const paged=useMemo(()=>paginate(displayedFeedAll,pages[activeMenu]||1),[displayedFeedAll,pages,activeMenu]);
  const displayedFeed=paged.items;

  /* 右侧和底部派生数据 */
  const marketSignalItems=signals.slice(0,4);
  const tickerItems=normalizedFeed.slice(0,12);

  const hotGroups=useMemo(()=>{
    const sourceMap=new Map<string,string[]>();
    normalizedFeed.slice(0,100).forEach((item)=>{
      if(!sourceMap.has(item.source)) sourceMap.set(item.source,[]);
      const arr=sourceMap.get(item.source)!;
      if(!arr.includes(item.title)&&arr.length<3) arr.push(item.title);
    });
    return Array.from(sourceMap.entries()).slice(0,6);
  },[normalizedFeed]);

  const heatmapItems=useMemo(()=>{
    const counts=new Map<string,number>();
    normalizedFeed.forEach((item)=>{
      if(item.tags?.includes("中国市场")) counts.set("中国",(counts.get("中国")||0)+1);
      if(item.tags?.includes("美股")) counts.set("美国",(counts.get("美国")||0)+1);
      if(item.tags?.includes("宏观")) counts.set("欧洲",(counts.get("欧洲")||0)+1);
      if(item.tags?.includes("加密")) counts.set("全球加密",(counts.get("全球加密")||0)+1);
      if(item.tags?.includes("AI")) counts.set("AI板块",(counts.get("AI板块")||0)+1);
    });
    const fallback:[string,number][]=[["中国",18],["美国",14],["欧洲",9],["全球加密",12],["AI板块",11]];
    const data=Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]);
    return data.length?data.slice(0,5):fallback;
  },[normalizedFeed]);

  const aiSummary=useMemo(()=>{
    const highCount=normalizedFeed.filter((item)=>item.importance==="高").length;
    const aiCount=normalizedFeed.filter((item)=>item.tags?.includes("AI")).length;
    const cryptoCount=normalizedFeed.filter((item)=>item.tags?.includes("加密")||cryptoSources.includes(item.source)).length;
    const macroCount=normalizedFeed.filter((item)=>item.tags?.includes("宏观")).length;
    return [
      `高优先级情报共 ${highCount} 条，当前市场以高频突发与重点催化并行为主。`,
      `AI相关内容 ${aiCount} 条，AI主题仍是当前最稳定的主线之一。`,
      `加密相关情报 ${cryptoCount} 条，短线资金与情绪波动仍需重点跟踪。`,
      `宏观数据相关 ${macroCount} 条，利率预期与美元链条仍会影响风险偏好。`,
    ];
  },[normalizedFeed]);

  const timelineItems=useMemo(()=>normalizedFeed.slice(0,6).map((item)=>({time:item.time,title:item.title,source:item.source})),[normalizedFeed]);

  const systemStatus=useMemo(()=>[
    {label:"Data Feeds",value:normalizedFeed.length>0?"Online":"Idle"},
    {label:"AI Analysis",value:loading||searching?"Running":"Ready"},
    {label:"Live Signals",value:`${signals.length} Active`},
    {label:"Refresh Interval",value:"30s"},
  ],[normalizedFeed.length,loading,searching,signals.length]);

  const flowStats=useMemo(()=>[
    {label:"News / Batch",value:`${normalizedFeed.slice(0,30).length}`},
    {label:"Hot Sources",value:`${hotGroups.length}`},
    {label:"Signals",value:`${signals.length}`},
    {label:"Current Page",value:`${paged.page}/${paged.totalPages}`},
  ],[normalizedFeed,hotGroups.length,signals.length,paged.page,paged.totalPages]);

function setPageForMenu(menu:string,page:number){
  setPages((prev)=>({...prev,[menu]:clamp(page,1,MAX_PAGES)}));
}

return(
  <div className="intel-root">
    <div className="intel-bg"/>
    <div className="intel-grid"/>
    <div className="intel-glow"/>

    <main className="page">
      {/* 背景增强层 */}
      <div className="intel-bg-enhance">
        <div className="intel-scan">
          <div className="scan-left"/>
          <div className="scan-right"/>
        </div>
        <div className="intel-particles"/>
        <div className="intel-dataflow">
          <div className="data-left"/>
          <div className="data-right"/>
        </div>
      </div>

      {/* Hero 主视觉 */}
      <section className="hero hero-v36 hero-terminal-v41">
        <div className="hero-frame-lines">
          <span className="frame-corner frame-corner-tl"/>
          <span className="frame-corner frame-corner-tr"/>
          <span className="frame-corner frame-corner-bl"/>
          <span className="frame-corner frame-corner-br"/>
          <span className="frame-line frame-line-top"/>
          <span className="frame-line frame-line-bottom"/>
          <span className="frame-line frame-line-left"/>
          <span className="frame-line frame-line-right"/>
        </div>

        <div className="hero-grid-overlay"/>
        <div className="hero-sidewalls"/>
        <div className="hero-scanlines"/>
        <div className="hero-coord top-left">+ LAT: 34.02 / LONG: -116.24</div>
        <div className="hero-coord top-right">+ ENCRYPTION STRENGTH: 443-256</div>
<div className="hero-top-hud-title">
  <div className="hero-top-hud-main">TANDER GLOBAL INTELLIGENCE TERMINAL</div>
</div>
<TopMarketStrip/>
        <div className="terminal-top-ticker">
          <div className="terminal-top-ticker-live">LIVE</div>
          <div className="terminal-top-ticker-text">
            CoinDesk • U.S. SEC chief Atkins said bond with sister agency CFTC to include joint meetings, xsams
          </div>
        </div>

        <div className="hero-terminal-shell hero-terminal-shell-clean">
          <div className="hero-brand hero-brand-fixed">
            <HeaderLogo size={1} />
            <div className="hero-copy terminal-copy">
              <div className="terminal-title">
         
              </div>

              <div className="hero-search">
                <span className="icon">⌕</span>
                <input
                  value={searchInput}
                  onChange={(e)=>setSearchInput(e.target.value)}
                  placeholder="全球情报中心· AI预警>"
                />
              </div>
            </div>
          </div>

          <div className="hero-earth-only">
            <div className="terminal-earth-wrap">
              <div className="terminal-earth-stage">
                <div className="terminal-earth-back-glow"/>
                <div className="terminal-earth-beam beam-left"/>
                <div className="terminal-earth-beam beam-right"/>
                <div className="terminal-earth-ring ring-a"/>
                <div className="terminal-earth-ring ring-b"/>
                <div className="terminal-earth-ring ring-c"/>
                <div className="terminal-earth-ring ring-d"/>
                <div className="terminal-earth-ring ring-e"/>

                <div className="terminal-earth-orbit orbit-a"><span className="orbit-dot"/></div>
                <div className="terminal-earth-orbit orbit-b"><span className="orbit-dot"/></div>
                <div className="terminal-earth-orbit orbit-c"><span className="orbit-dot"/></div>
                <div className="terminal-earth-orbit orbit-d"><span className="orbit-dot"/></div>
                <div className="terminal-earth-orbit orbit-e"><span className="orbit-dot"/></div>

<div className="terminal-earth-core">
  <img src="/earth-core.jpg" alt="Earth" className="terminal-earth-img"/>
  <div className="terminal-earth-scan"/>
  <div className="terminal-earth-grid"/>
  <span className="earth-node node-1"/>
  <span className="earth-node node-2"/>
  <span className="earth-node node-3"/>
  <span className="earth-node node-4"/>
  <span className="earth-node node-5"/>
  <span className="earth-node node-6"/>
</div>

<div className="earth-flow-overlay">
  <svg viewBox="0 0 600 600" className="earth-flow-svg">

    <circle cx="300" cy="300" r="220" className="flow-line"/>
    <circle cx="300" cy="300" r="260" className="flow-line"/>

    <circle cx="300" cy="300" r="220" className="flow-move"/>
    <circle cx="300" cy="300" r="260" className="flow-move"/>

    {/* 粒子 */}
    <circle cx="520" cy="300" r="3" className="flow-dot dot1"/>
    <circle cx="560" cy="300" r="3" className="flow-dot dot2"/>
    <circle cx="300" cy="80" r="3" className="flow-dot dot3"/>

  </svg>
</div>
                <div className="terminal-earth-front-glow"/>
                <div className="terminal-earth-base"/>
                <div className="terminal-earth-base-line"/>
              </div>
            </div>
          </div>
        </div>



<div className="hero-clock-card">
  <div className="hero-clock-head">
    <span className="hero-clock-kicker">TIME SYNC</span>
    <span className="hero-clock-status">LIVE</span>
  </div>

  <div className="hero-clock-main">
    <div className="hero-clock-main-label">BEIJING NODE</div>
    <div className="hero-clock-main-time">{beijingTime}</div>
    <div className="hero-clock-main-sub">UTC+08 / PRIMARY REFERENCE</div>
  </div>

  <div className="hero-clock-divider" />

  <div className="hero-clock-list">
    <div className="hero-clock-row">
      <span className="hero-clock-code">LDN</span>
      <span className="hero-clock-value">{londonTime}</span>
    </div>
    <div className="hero-clock-row hero-clock-row-active">
      <span className="hero-clock-code">BJS</span>
      <span className="hero-clock-value">{beijingTime}</span>
    </div>
    <div className="hero-clock-row">
      <span className="hero-clock-code">NYC</span>
      <span className="hero-clock-value">{newYorkTime}</span>
    </div>
  </div>

  <div className="hero-clock-corner-mark" />
</div>

        <div className="intel-ticker-floating">
          <div className="ticker-label">⚡ LIVE</div>
          <div className="ticker-track-wrap">
            <div className="ticker-marquee">
              {tickerItems.length===0 ? (
                <span className="ticker-item">暂无实时情报数据</span>
              ) : (
                [...tickerItems,...tickerItems].map((item,index)=>(
                  <span key={`${item.id}-${index}`} className="ticker-item">
                    <span className="ticker-time">{item.time}</span>
                    <span className="ticker-sep">◆</span>
                    <span className="ticker-source">{item.source}</span>
                    <span className="ticker-sep">◆</span>
                    <span className="ticker-title">{item.title}</span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 顶部频道导航 */}
      <div className="top-section-nav">
        {topChannels.map((item)=>(
          <button
            key={item}
            className={`top-section-nav-item ${topChannel===item?"active":""}`}
            onClick={()=>setTopChannel(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {/* 实时情报页 */}
      {topChannel==="实时情报"&&(
        <>
          <div className="hero-bottom-modules">
            <aside className="hero-bottom-left">
              <div className="panel sidebar">
                <div className="menu">
                  {menuItems.map((item)=>(
                    <a
                      key={item}
                      className={activeMenu===item?"active":""}
                      onClick={()=>{setActiveMenu(item);setPageForMenu(item,1);}}
                    >
                      {item}
                    </a>
                  ))}
                </div>
                <div className="section-note">
                  首屏仅保留标题 / LIVE / 搜索框 / 图标 / GLOBAL MARKET TICKER / 时间，其余模块已下移。
                </div>
              </div>

              <div className="terminal-mini-node">
                <div className="terminal-mini-node-label">GLOBAL NODES</div>
                <div className="terminal-mini-node-value">128</div>
              </div>

              <TerminalWorldCard/>
              <SystemLogPanel logs={logs}/>
            </aside>

            <section className="hero-bottom-center">
              <div className="panel feed-panel">
                <div className="feed-head">
                  <div>
                    <div className="feed-title">{currentTitle}</div>
                    <div className="feed-sub">UTC时间 / 来源 / 标题 / AI 摘要 / 标签 / 重要度</div>
                  </div>
                  <div className="feed-actions">
                    <button className="refresh-btn" onClick={refreshAll} disabled={refreshing||loading||searching}>
                      {refreshing?"同步中...":"SYNC"}
                    </button>
                  </div>
                </div>

                <div className="feed-list">
                  {loading||searching ? (
                    <div className="feed-empty">正在加载数据...</div>
                  ) : displayedFeed.length===0 ? (
                    <div className="feed-empty">暂无数据</div>
                  ) : (
                    displayedFeed.map((item)=>(
                      <div className="feed-item" key={`${item.source}-${item.id}-${item.title}`}>
                        <div className="feed-item-top">
                          <span className="feed-time">{item.time}</span>
                          <span className="feed-source" style={getSourceStyle(item.source)} title={item.source}>{item.source}</span>
                          <span className={`feed-importance ${item.importance==="高"?"high":"mid"}`}>{item.importance}</span>
                        </div>

                        <div className="feed-item-title">
                          <a href={item.url||"#"} target="_blank" rel="noopener noreferrer" title={item.title}>{item.title}</a>
                        </div>

                        <div className="feed-summary" title={item.summary}>{item.summary}</div>

                        {!!item.tags?.length&&(
                          <div className="feed-tags">
                            {item.tags.map((tag)=>(
                              <span key={`${item.id}-${tag}`} className="feed-tag" style={getTagStyle(tag)}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="pagination">
                  <div className="pagination-info">
                    第 {paged.page} / {paged.totalPages} 页 ｜ 共 {paged.totalItems} 条 ｜ 每页 {PAGE_SIZE} 条
                  </div>
                  <div className="pagination-actions">
                    <button className="page-btn" onClick={()=>setPageForMenu(activeMenu,paged.page-1)} disabled={paged.page<=1}>上一页</button>
                    <button className="page-btn" onClick={()=>setPageForMenu(activeMenu,paged.page+1)} disabled={paged.page>=paged.totalPages}>下一页</button>
                  </div>
                </div>
              </div>
            </section>

            <aside className="hero-bottom-right">
              <SignalMonitor/>
              <ThreatMapPanel/>

              <div className="panel side-panel">
                <div className="side-panel-title"><h3>热点追踪</h3><span>High Frequency</span></div>
                {hotGroups.length===0 ? (
                  <div className="feed-empty">暂无热点数据</div>
                ) : (
                  <div className="side-list">
                    {hotGroups.map(([source,items])=>(
                      <div key={source}>
                        <div style={{marginBottom:8,fontSize:12,color:"#a7dfff",fontWeight:700,letterSpacing:".5px"}}>{source}</div>
                        {items.map((title,idx)=>(
                          <div className="side-item" key={`${source}-${idx}-${title}`}>
                            <div className="side-item-time">{idx===0?"TOP":`${idx+1}`}</div>
                            <a className="side-item-title" href="#" onClick={(e)=>e.preventDefault()} title={title}>{title}</a>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel side-panel">
                <div className="side-panel-title"><h3>系统同步</h3><span>Live Sync</span></div>
                <div className="sync-row">
                  <div className="sync-pill"><span className="sync-dot"/><span>{refreshing?"正在同步":"实时在线"}</span></div>
                  <span className="muted">30s</span>
                </div>
              </div>

              <div className="panel side-panel">
                <div className="side-panel-title"><h3>微型趋势</h3><span>Monitor</span></div>
                <div className="side-list">
                  {sparks.map((item)=>(
                    <div className="sync-row" key={item.name}>
                      <div>
                        <div style={{fontSize:14,color:"#e8f5ff",fontWeight:700}}>{item.name}</div>
                        <div className="muted" style={{marginTop:4,fontSize:12}}>{item.price}</div>
                      </div>
                      <div style={{width:110,display:"flex",alignItems:"center",gap:8}}>
                        <svg viewBox="0 0 104 28" style={{width:82,height:22}}>
                          <polyline fill="none" stroke={item.cls==="up"?"#52f0c9":"#ff6f91"} strokeWidth="2" points={toPoints(item.values)}/>
                        </svg>
                        <div className={item.cls==="up"?"text-up":"text-down"}>{item.change}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <section className="footer-strip">
            <div className="panel footer-panel">
              <div className="footer-title"><h3>Global Heatmap</h3><span>热点区域强度</span></div>
              <div className="heatmap">
                <svg viewBox="0 0 820 158" aria-hidden="true">
                  <defs>
                    <linearGradient id="heatStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(81,227,255,0.8)"/>
                      <stop offset="100%" stopColor="rgba(138,125,255,0.8)"/>
                    </linearGradient>
                  </defs>
                  <ellipse cx="300" cy="84" rx="220" ry="58" fill="none" stroke="rgba(81,227,255,.18)"/>
                  <path d="M110 86 C156 57,228 49,284 60 C336 71,410 70,474 55 C544 40,628 49,712 86" fill="none" stroke="url(#heatStroke)" strokeWidth="2" opacity=".75"/>
                  {heatmapItems.map(([name,count],index)=>(
                    <g key={name} transform={`translate(${545+(index%2)*120}, ${30+Math.floor(index/2)*42})`}>
                      <text x="0" y="0" fill="#9ecaff" fontSize="11" dominantBaseline="middle">{name}</text>
                      <text x="70" y="0" fill="#eef7ff" fontSize="16" fontWeight="700" dominantBaseline="middle">{count}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            <div className="panel footer-panel">
              <div className="footer-title"><h3>Intelligence Flow</h3><span>情报流速监控</span></div>
              <div className="flow-grid">
                <div className="flow-list">
                  {flowStats.map((item)=>(
                    <div className="flow-item" key={item.label}>
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flow-bars">
                  <div className="flow-bar" style={{height:"34%"}}/>
                  <div className="flow-bar" style={{height:"62%"}}/>
                  <div className="flow-bar" style={{height:"48%"}}/>
                  <div className="flow-bar" style={{height:"81%"}}/>
                  <div className="flow-bar" style={{height:"66%"}}/>
                  <div className="flow-bar" style={{height:"92%"}}/>
                </div>
              </div>
            </div>
          </section>

          <div className="footer-strip" style={{marginTop:0}}>
            <div className="panel footer-panel">
              <div className="footer-title"><h3>AI Summary</h3><span>智能摘要</span></div>
              <div className="side-list">
                {aiSummary.map((line)=>(
                  <div className="side-item" key={line}>
                    <div className="side-item-time">AI</div>
                    <div className="side-item-title">{line}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel footer-panel">
              <div className="footer-title"><h3>System Status</h3><span>终端状态</span></div>
              <div className="metric-grid">
                {systemStatus.map((item)=>(
                  <div className="metric-card" key={item.label}>
                    <div className="metric-k">{item.label}</div>
                    <div className="metric-v">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="footer-strip" style={{marginTop:0,marginBottom:42}}>
            <div className="panel footer-panel">
              <div className="footer-title"><h3>Events Timeline</h3><span>重大事件时间轴</span></div>
              <div className="side-list">
                {timelineItems.map((item)=>(
                  <div className="side-item" key={`${item.time}-${item.title}`}>
                    <div className="side-item-time">{item.time}</div>
                    <div>
                      <div className="side-item-title">{item.title}</div>
                      <div className="muted" style={{marginTop:4,fontSize:12}}>{item.source}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel footer-panel">
              <div className="footer-title"><h3>Market Signal</h3><span>实时监控</span></div>
              <div className="side-list">
                {marketSignalItems.map((item)=>(
                  <div className="sync-row" key={item.name}>
                    <div>
                      <div style={{fontSize:14,color:"#e8f5ff",fontWeight:700}}>{item.name}</div>
                      <div className="muted" style={{marginTop:4,fontSize:12}}>{item.price}</div>
                    </div>
                    <div className={item.cls==="up"?"text-up":"text-down"}>{item.change}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 宏观数据页 */}
      {topChannel==="宏观数据"&&<MacroDataPage/>}
    </main>
  </div>
);
}