/* Mesh / Minima — safe expressions and small, inspectable numerical methods. */
(function (root) {
'use strict';
const funcs={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sinh:Math.sinh,cosh:Math.cosh,exp:Math.exp,log:Math.log,ln:Math.log,sqrt:Math.sqrt,abs:Math.abs,pow:Math.pow,min:Math.min,max:Math.max};
function compile(source,dim=2){
 if(source.length>500)throw Error('Keep the expression under 500 characters.');
 const tokens=[];let i=0;
 while(i<source.length){if(/\s/.test(source[i])){i++;continue}const rest=source.slice(i),m=rest.match(/^(?:\d*\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?/i)||rest.match(/^[a-z]+/i);if(m){tokens.push(m[0].toLowerCase());i+=m[0].length}else if('+-*/^(),'.includes(source[i]))tokens.push(source[i++]);else throw Error('Use numbers, x, y, z, mathematical functions, and + − * / ^.');}
 if(tokens.length>200)throw Error('This expression is too long.');let p=0;
 function expression(min=0){let token=tokens[p++],left;
  if(token==='+'||token==='-'){const a=expression(25);left=v=>token==='-'?-a(v):a(v)}
  else if(token==='('){left=expression();if(tokens[p++]!==')')throw Error('A closing parenthesis is missing.');}
  else if(token!==undefined&&!isNaN(Number(token))){const n=Number(token);left=()=>n}
  else if(['x','y','z'].includes(token)){const k=['x','y','z'].indexOf(token);if(k>=dim)throw Error('Switch to three variables to use z.');left=v=>v[k]}
  else if(token==='pi'||token==='e'){const n=token==='pi'?Math.PI:Math.E;left=()=>n}
  else if(Object.hasOwn(funcs,token)){if(tokens[p++]!=='(')throw Error(token+' needs parentheses.');const args=[expression()];while(tokens[p]===','){p++;args.push(expression())}if(tokens[p++]!==')')throw Error('A closing parenthesis is missing.');const arity=['pow','min','max'].includes(token)?2:1;if(args.length!==arity)throw Error(token+' expects '+arity+' argument(s).');left=v=>funcs[token](...args.map(a=>a(v)))}
  else throw Error('Expected a number, variable, or function'+(token?' near “'+token+'”.':'.'));
  while(p<tokens.length){const op=tokens[p],prec={'+':10,'-':10,'*':20,'/':20,'^':30}[op];if(prec===undefined||prec<min)break;p++;const a=left,b=expression(op==='^'?prec:prec+1);left=v=>{const x=a(v),y=b(v);return op==='+'?x+y:op==='-'?x-y:op==='*'?x*y:op==='/'?x/y:x**y}}
  return left;
 }
 const f=expression();if(p!==tokens.length)throw Error('Use * for multiplication, for example 2*x.');return v=>{try {const n=f(v);return Number.isFinite(n)?n:NaN}catch{return NaN}};
}
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>Math.sqrt(dot(a,a)),add=(a,b,s=1)=>a.map((v,i)=>v+s*b[i]),eye=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j))),mv=(a,v)=>a.map(r=>dot(r,v));
function gradient(f,x,stepScale=1){return x.map((v,i)=>{const h=stepScale*1e-5*Math.max(1,Math.abs(v)),a=x.slice(),b=x.slice();a[i]+=h;b[i]-=h;return(f(a)-f(b))/(2*h)})}
function hessian(f,x,stepScale=1){const n=x.length,H=eye(n),f0=f(x),hs=x.map(v=>stepScale*1e-4*Math.max(1,Math.abs(v)));for(let i=0;i<n;i++)for(let j=i;j<n;j++){const hi=hs[i],hj=hs[j];let v;if(i===j){const a=x.slice(),b=x.slice();a[i]+=hi;b[i]-=hi;v=(f(a)-2*f0+f(b))/(hi*hi)}else{const pp=x.slice(),pm=x.slice(),mp=x.slice(),mm=x.slice();pp[i]+=hi;pp[j]+=hj;pm[i]+=hi;pm[j]-=hj;mp[i]-=hi;mp[j]+=hj;mm[i]-=hi;mm[j]-=hj;v=(f(pp)-f(pm)-f(mp)+f(mm))/(4*hi*hj)}H[i][j]=H[j][i]=v}return H}
function eigenvalues(H){const a=H.map(r=>r.slice()),n=a.length;if(!a.flat().every(Number.isFinite))return Array(n).fill(NaN);for(let k=0;k<30;k++){let p=0,q=1;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.abs(a[i][j])>Math.abs(a[p][q])){p=i;q=j}if(Math.abs(a[p][q])<1e-10)break;const angle=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(angle),s=Math.sin(angle),app=a[p][p],aqq=a[q][q],apq=a[p][q];for(let r=0;r<n;r++)if(r!==p&&r!==q){const rp=a[r][p],rq=a[r][q];a[r][p]=a[p][r]=c*rp-s*rq;a[r][q]=a[q][r]=s*rp+c*rq}a[p][p]=c*c*app-2*s*c*apq+s*s*aqq;a[q][q]=s*s*app+2*s*c*apq+c*c*aqq;a[p][q]=a[q][p]=0}return a.map((r,i)=>r[i]).sort((a,b)=>a-b)}
function solve(A,b){const a=A.map((r,i)=>[...r,b[i]]),n=b.length;for(let i=0;i<n;i++){let k=i;for(let j=i+1;j<n;j++)if(Math.abs(a[j][i])>Math.abs(a[k][i]))k=j;[a[i],a[k]]=[a[k],a[i]];if(Math.abs(a[i][i])<1e-14)return null;const d=a[i][i];for(let j=i;j<=n;j++)a[i][j]/=d;for(let r=0;r<n;r++)if(r!==i){const m=a[r][i];for(let j=i;j<=n;j++)a[r][j]-=m*a[i][j]}}return a.map(r=>r[n])}
function classify(f,x,tolerance=1e-5){
 // Finite differences can alias a rapidly varying function. Compare step sizes
 // before reporting any stationary-point classification. This is a diagnostic,
 // not a proof that the derivatives or the resulting classification are exact.
 const grads=[1,.5,.25].map(scale=>gradient(f,x,scale)),Hs=[1,.5,.25].map(scale=>hessian(f,x,scale));
 if(!grads.flat().every(Number.isFinite)||!Hs.flat(2).every(Number.isFinite))return 'unreliable';
 for(let i=1;i<grads.length;i++){
  const a=grads[i-1],b=grads[i];
  if(norm(add(a,b,-1))>tolerance*.25+.05*Math.max(norm(a),norm(b)))return 'unreliable';
  const ha=Hs[i-1].flat(),hb=Hs[i].flat();
  if(norm(add(ha,hb,-1))>1e-4+.05*Math.max(norm(ha),norm(hb)))return 'unreliable';
 }
 const ev=eigenvalues(Hs[2]),eps=1e-5*Math.max(1,...ev.map(Math.abs));return ev.every(v=>v>eps)?'minimum':ev.every(v=>v<-eps)?'maximum':ev.some(v=>v<-eps)&&ev.some(v=>v>eps)?'saddle':'stationary';
}
function optimize(f,initial,{method='bfgs',bound=4,maxIterations=700,tolerance=1e-5}={}){
 let x=initial.slice(),fx=f(x),g=gradient(f,x),B=eye(x.length),prevG=null,prevD=null,status='limit';const path=[];
 const record=()=>path.push({x:x.slice(),f:fx,g:norm(g)});record();
 if(!Number.isFinite(fx)||!g.every(Number.isFinite))return{path,status:'invalid',method};
 if(x.some(v=>Math.abs(v)>bound))return{path,status:'boundary',method};
 for(let k=0;k<maxIterations;k++){
  if(norm(g)<tolerance){status=classify(f,x,tolerance);break}let d=g.map(v=>-v);
  if(method==='bfgs')d=mv(B,g).map(v=>-v);
  if(method==='cg'&&prevG&&k%x.length!==0){const beta=Math.max(0,dot(g,add(g,prevG,-1))/Math.max(dot(prevG,prevG),1e-30));d=add(d,prevD,beta)}
  if(method==='newton'){const H=hessian(f,x),ev=eigenvalues(H),shift=Math.max(0,1e-3-ev[0]);for(let i=0;i<x.length;i++)H[i][i]+=shift;d=solve(H,g.map(v=>-v))||d}
  if(!d.every(Number.isFinite)||dot(d,g)>=-1e-12*norm(d)*norm(g)){d=g.map(v=>-v);B=eye(x.length)}
  let alpha=Math.min(method==='gd'?.18:method==='cg'?.5:1,bound*.7/Math.max(norm(d),1e-30)),edge=Infinity;
  for(let i=0;i<x.length;i++)if(d[i]!==0)edge=Math.min(edge,((d[i]>0?bound:-bound)-x[i])/d[i]);
  if(edge<1e-12){status='boundary';break}alpha=Math.min(alpha,edge);const slope=dot(g,d);let xn,fn,accepted=false;
  for(let j=0;j<45;j++){xn=add(x,d,alpha);fn=f(xn);if(Number.isFinite(fn)&&fn<=fx+1e-4*alpha*slope){accepted=true;break}alpha*=.5}
  if(!accepted||norm(add(xn,x,-1))<1e-13){status='stalled';break}
  const gn=gradient(f,xn);if(!gn.every(Number.isFinite)){status='invalid';break}
  if(method==='bfgs'){const s=add(xn,x,-1),y=add(gn,g,-1),ys=dot(y,s);if(ys>1e-12*norm(y)*norm(s)){const By=mv(B,y),yBy=dot(y,By);B=B.map((r,i)=>r.map((v,j)=>v+(1+yBy/ys)*s[i]*s[j]/ys-(s[i]*By[j]+By[i]*s[j])/ys))}else B=eye(x.length)}
  prevG=g;prevD=d;x=xn;fx=fn;g=gn;record();
  if(x.some(v=>Math.abs(v)>=bound-1e-10)){status=norm(g)<tolerance?classify(f,x,tolerance):'boundary';break}
 }
 if(status==='limit'&&norm(g)<tolerance)status=classify(f,x,tolerance);
 return{path,status,method};
}
const api={compile,gradient,hessian,eigenvalues,optimize,classify,norm,dot};
if(typeof module==='object'&&module.exports)module.exports=api;else root.Minima=api;
})(typeof globalThis!=='undefined'?globalThis:this);
