/* bodytur: советы по правилам (не API и не ChatGPT), добровольная передача отчёта */
(()=>{'use strict';
const STORAGE_KEY='moy-turnik-v1';
const START='2026-11-23';
const STRENGTH_DAYS=[0,2,5];
const $=id=>document.getElementById(id);
function readStore(){try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');return data&&typeof data==='object'?data:{}}catch(_){return {}}}
function addDay(start,n){const d=new Date(start+'T12:00:00');d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function pickIndex(){const el=document.querySelector('#daySelect .day.active');const n=Number(el&&el.dataset.day);return Number.isInteger(n)&&n>=0&&n<28?n:0}
function recordedNumber(v){return typeof v==='number'&&Number.isFinite(v)?v:(v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null)}
function sumSets(d,id){const arr=d&&d.sets&&Array.isArray(d.sets[id])?d.sets[id]:[];return arr.reduce((n,v)=>n+(recordedNumber(v)||0),0)}
function weekSummary(data,index){const start=data.cycleStart||START;const week=Math.floor(index/7),tot={charge:0,strength:0,pull:0,push:0,steps:0};for(let j=week*7;j<week*7+7;j++){const d=(data.days||{})[addDay(start,j)]||{};if(d.charge===true)tot.charge++;if(STRENGTH_DAYS.includes(j%7)&&d.activity===true)tot.strength++;tot.pull+=sumSets(d,'pull');tot.push+=sumSets(d,'push');tot.steps+=recordedNumber(d.steps)||0;}return tot}
function refreshCoach(){
 const title=$('coachAdvice');if(!title)return;
 const data=readStore(),index=pickIndex(),kind=STRENGTH_DAYS.includes(index%7)?'strength':index%7===6?'rest':'recovery';
 const date=addDay(data.cycleStart||START,index),day=(data.days||{})[date]||{},week=weekSummary(data,index);
 const sleep=recordedNumber(day.sleep),mood=recordedNumber(day.mood);
 let advice,reason;
 if(day.activity===true&&kind==='strength'){advice='Силовая отмечена как выполненная. Не требуется дополнительно тренироваться до отказа ради плана.';reason='В следующий силовой день возвращайся к обычной нагрузке, если самочувствие позволяет.';}
 else if(kind==='strength'&&((sleep!==null&&sleep<6)||(mood!==null&&mood<=2))){
  advice='Сегодня разумнее снизить нагрузку: попробуй на один подход меньше или оставляй 3 повтора в запасе. При выраженной усталости замени силовую прогулкой.';
  reason=(sleep!==null&&sleep<6?'Указан сон '+sleep+' ч. ':'')+(mood!==null&&mood<=2?'Самочувствие отмечено как '+mood+'/5. ':'')+'Это ориентир по твоим отметкам, а не медицинская оценка.';
 }
 else if(kind==='strength'&&index>=7){
  const prev=(data.days||{})[addDay(data.cycleStart||START,index-7)]||{};
  if(prev.sets&&Object.keys(prev.sets).length){
    advice='Сравни технику и повторения с прошлой неделей. Если предыдущая нагрузка была тяжёлой, сначала закрепи её, не увеличивая все подходы одновременно.';
    reason='На прошлой неделе в такой же день записано: '+sumSets(prev,'pull')+' подтягиваний и '+sumSets(prev,'push')+' отжиманий суммарно.';
  }else{
    advice='Начни с плановых рабочих подходов. Выполняй упражнения с запасом 1–3 повтора, не доводя каждый подход до отказа.';
    reason='Для сравнения пока нет записей аналогичной тренировки предыдущей недели.';
  }
 }
 else if(kind==='strength'){advice='Начни с плановых рабочих подходов. Сохраняй 1–3 повтора в запасе и записывай фактические результаты.';
  reason='Указаны исходные максимумы около 6 подтягиваний и 30 отжиманий.';}
 else if(kind==='rest'){advice='День отдыха: восстановление входит в программу. Спокойная прогулка допустима по самочувствию.';reason='Не нужно компенсировать пропуски тренировками подряд.';}
 else{advice='Сегодня достаточно прогулки и лёгкой суставной разминки. Если есть сильная усталость, сократи продолжительность.';reason='Силовые занятия распределены на понедельник, среду и субботу.';}
 title.textContent=advice;$('coachReason').textContent=reason;
 $('coachMini').replaceChildren();
 [['Зарядка',week.charge+'/7'],['Силовые',week.strength+'/3'],['Турник',String(week.pull)]].forEach(([label,val])=>{
 const span=document.createElement('span'),bold=document.createElement('b');bold.textContent=val;span.appendChild(bold);span.append(document.createTextNode(' '+label));$('coachMini').appendChild(span);});
}
function makeReport(){
 const data=readStore(),start=data.cycleStart||START,days=data.days||{},test=data.tests||{};
 const last=addDay(start,27),lines=[
 'Отчёт из приложения bodytur: '+start+' — '+last,
 'Цель: домашние тренировки с турником и собственным весом. Исходные максимумы: около 6 подтягиваний и 30 отжиманий.',
 'Ниже — только фактически внесённые результаты. Отсутствие записи не означает, что тренировка не выполнена.'
 ];
 let tc=0,ts=0,tp=0,tu=0;const sleep=[],mood=[];
 for(let w=0;w<4;w++){
  let weekPull=0,weekPush=0,weekCharge=0,weekStrength=0,weekSteps=0,logged=0;
  for(let n=0;n<7;n++){
   const i=w*7+n,d=days[addDay(start,i)]||{},hasData=Boolean(d.charge||d.activity||(d.sets&&Object.keys(d.sets).length)||recordedNumber(d.steps)!==null);
   if(hasData)logged++;if(d.charge){weekCharge++;tc++;}if(STRENGTH_DAYS.includes(i%7)&&d.activity){weekStrength++;ts++;}
   weekPull+=sumSets(d,'pull');weekPush+=sumSets(d,'push');weekSteps+=recordedNumber(d.steps)||0;
   if(recordedNumber(d.sleep)!==null)sleep.push(Number(d.sleep));
   if(recordedNumber(d.mood)!==null)mood.push(Number(d.mood));
  }
  tp+=weekPull;tu+=weekPush;
  const tk=start===START?String(w+1):start+':'+(w+1),t=test[tk]||{};
  const maxes=[];if(recordedNumber(t.pull)!==null)maxes.push('макс. подтягиваний '+t.pull);if(recordedNumber(t.push)!==null)maxes.push('макс. отжиманий '+t.push);
  lines.push('Неделя '+(w+1)+': запись в '+logged+'/7 дней, зарядка '+weekCharge+'/7, силовые '+weekStrength+'/3, подтягиваний '+weekPull+', отжиманий '+weekPush+', шагов '+weekSteps+(maxes.length?', '+maxes.join(', '):'')+'.');
 }
 lines.push('За цикл: зарядка '+tc+'/28, силовые '+ts+'/12, подтягиваний '+tp+', отжиманий '+tu+'.');
 if(sleep.length)lines.push('Сон: '+sleep.length+' записей, среднее '+(sleep.reduce((a,b)=>a+b,0)/sleep.length).toFixed(1)+' ч.');
 if(mood.length)lines.push('Самочувствие: '+mood.length+' записей, средняя оценка '+(mood.reduce((a,b)=>a+b,0)/mood.length).toFixed(1)+'/5.');
 lines.push('Проанализируй прогресс с учётом неполноты записей, оцени разумность нагрузки, предложи корректировки на следующую неделю и коротко объясни их. Не делай медицинских выводов и не придумывай отсутствующие показатели.');
 return lines.join('\n');
}
async function copyReport(){
 const report=makeReport();
 try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(report);alert('Сводка скопирована. Открой ChatGPT и вставь её в сообщение.');return;}}
 catch(_){}
 const t=document.createElement('textarea');t.value=report;t.style.position='fixed';t.style.top='-9999px';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();if(ok)alert('Сводка скопирована. Открой ChatGPT и вставь её.');else alert('Автоматическое копирование недоступно. Попробуй «Поделиться».');
}
$('coachCopy').addEventListener('click',copyReport);
$('coachShare').addEventListener('click',async()=>{
 const text=makeReport();
 if(typeof navigator.share==='function'){try{await navigator.share({title:'bodytur — отчёт для ChatGPT',text});return;}catch(err){if(err&&err.name==='AbortError')return;}}
 await copyReport();
});
let finish=0,timer=null;
function tick(){if(!finish)return;const remaining=Math.max(0,Math.ceil((finish-Date.now())/1000));const label=$('restTimerLabel');if(!remaining){label.textContent='Можно продолжать';finish=0;clearInterval(timer);timer=null;$('restTimerButton').textContent='⏱ Отдых 90 сек';return;}label.textContent='Осталось '+Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0');}
$('restTimerButton').addEventListener('click',()=>{if(finish){finish=0;clearInterval(timer);timer=null;$('restTimerButton').textContent='⏱ Отдых 90 сек';$('restTimerLabel').textContent='Таймер остановлен';return;}finish=Date.now()+90000;$('restTimerButton').textContent='Остановить таймер';tick();timer=setInterval(tick,500);});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
const heading=$('dayHeading');
if(heading)new MutationObserver(refreshCoach).observe(heading,{subtree:false,childList:true});
document.addEventListener('input',ev=>{if(ev.target.matches('#sleepInput,#stepsInput,#weightInput'))refreshCoach();});
document.addEventListener('change',ev=>{if(ev.target.matches('#activityCheck,#chargeCheck'))refreshCoach();});
window.addEventListener('storage',ev=>{if(ev.key===STORAGE_KEY)refreshCoach();});
refreshCoach();
})();