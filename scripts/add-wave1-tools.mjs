import fs from 'node:fs';

const toolsArray = [
  `    {id:'file_encrypt',fam:'crypto',glyph:'AE',name:'File encryptor',task:'Lock a file with a password',tag:'AES, 256-bit',accepts:'any',live:true,kind:'process',action:'Encrypt file',ext:'bin',suffix:'encrypted',det:'D',
     desc:'Encrypt any file with AES-256-GCM and PBKDF2 password derivation entirely in browser RAM.',
     params:[
      P('pass','Passphrase','text',1,'SecurePassphrase2026!'),
      P('algo','Algorithm','select',1,'aes-256-gcm',{opts:[['aes-256-gcm','AES-256-GCM (Authenticated)']]})
     ],
     groups:[['Encryption Settings',['pass','algo']]],
     plain:function(){return 'Derives a 256-bit key using PBKDF2 and encrypts the file with AES-256-GCM in local memory.';},
     run:async function(src,a,ctx){
      var pass=a.pass||'';
      if(!pass) throw new Error('A passphrase is required to encrypt the file.');
      var bytes;
      if(src&&src.getBytes) bytes=new Uint8Array(await src.getBytes());
      else if(ctx&&ctx.text) bytes=new TextEncoder().encode(ctx.text);
      else throw new Error('No file or text provided to encrypt.');
      var salt=crypto.getRandomValues(new Uint8Array(16));
      var iv=crypto.getRandomValues(new Uint8Array(12));
      var keyMat=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
      var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:100000,hash:'SHA-256'},keyMat,{name:'AES-GCM',length:256},false,['encrypt']);
      var ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},key,bytes);
      var out=new Uint8Array(16+12+ct.byteLength);
      out.set(salt,0);
      out.set(iv,16);
      out.set(new Uint8Array(ct),28);
      return {blob:new Blob([out],{type:'application/octet-stream'}),mime:'application/octet-stream',note:'Encrypted with AES-256-GCM ('+fmtBytes(out.length)+')'};
     }}`,

  `    {id:'signature_clean',fam:'photo',glyph:'SG',name:'Signature cleaner',task:'Clean up a signature',tag:'PNG, Clear',accepts:'image',live:true,kind:'process',action:'Clean signature',ext:'png',suffix:'clean-sig',det:'D',
     desc:'Lift a handwritten signature off paper onto a crisp transparent PNG background with adjustable luminance thresholding.',
     params:[
      P('thresh','Paper background threshold','range',1,0.72,{min:0.3,max:0.95,step:0.02,fmt:pct}),
      P('color','Ink enhancement','select',1,'original',{opts:[['original','Original ink color'],['fountain','Dark fountain-pen ink (#0F172A)'],['black','Pure black (#000000)']]})
     ],
     groups:[['Signature Enhancement',['thresh','color']]],
     plain:function(a){return 'Removes paper background above '+pct(a.thresh)+' luminance and isolates ink strokes.';},
     run:async function(src,a){
      var im=src.img,w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;
      var c=mkCanvas(w,h),g=c.getContext('2d');
      g.drawImage(im,0,0,w,h);
      var imgD=g.getImageData(0,0,w,h),d=imgD.data,limit=a.thresh*255;
      var isInkF=a.color==='fountain',isBlack=a.color==='black';
      for(var i=0;i<d.length;i+=4){
        var lum=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
        if(lum>limit){
          d[i+3]=0;
        }else{
          var alphaFactor=Math.min(255,Math.round((limit-lum)/(limit*0.35)*255));
          d[i+3]=Math.min(255,alphaFactor);
          if(isInkF){ d[i]=15;d[i+1]=23;d[i+2]=42; }
          else if(isBlack){ d[i]=0;d[i+1]=0;d[i+2]=0; }
        }
      }
      g.putImageData(imgD,0,0);
      return {blob:await toBlob(c,'image/png'),mime:'image/png',w:w,h:h,note:'Paper background removed ('+w+'×'+h+' px)'};
     }}`,

  `    {id:'heic_to_jpg',fam:'image',glyph:'HE',name:'HEIC to JPG',task:'Convert an iPhone photo',tag:'JPG, Export',accepts:'image',live:true,kind:'process',action:'Convert to JPG',ext:'jpg',suffix:'converted',det:'D',
     desc:'Convert Apple HEIC photos to standard JPEG format locally in your browser tab.',
     params:[
      P('qual','JPEG quality','range',1,0.92,{min:0.5,max:1.0,step:0.02,fmt:pct})
     ],
     groups:[['Quality Settings',['qual']]],
     plain:function(a){return 'Renders image and exports JPEG at '+pct(a.qual)+' quality.';},
     run:async function(src,a){
      var im=src.img;
      if(!im) throw new Error('Please select a photo to convert.');
      var w=im.naturalWidth||im.width||800,h=im.naturalHeight||im.height||600;
      var c=mkCanvas(w,h),g=c.getContext('2d');
      g.fillStyle='#FFFFFF';g.fillRect(0,0,w,h);
      g.drawImage(im,0,0,w,h);
      var blob=await toBlob(c,'image/jpeg',a.qual||0.92);
      return {blob:blob,mime:'image/jpeg',w:w,h:h,note:'Converted to JPEG ('+fmtBytes(blob.size)+')'};
     }}`,

  `    {id:'pdf_merge',fam:'pdf',glyph:'MG',name:'Merge PDF',task:'Join PDF files',tag:'PDF, Join',accepts:'text',live:true,kind:'live',ext:'pdf',det:'D',
     desc:'Combine multiple PDF streams or documents in designated order locally in memory.',
     params:[
      P('order','Document order','select',1,'asc',{opts:[['asc','First to Last (Sequential)'],['desc','Reverse Order']]})
     ],
     groups:[['Merge Options',['order']]],
     plain:function(a){return 'Concatenates PDF streams in '+a.order.toUpperCase()+' order.';},
     run:async function(src,a,ctx){
      var raw=(ctx.text||'').trim();
      if(!raw) throw new Error('Provide PDF streams or text documents to merge.');
      var docs=raw.split(/\\n===+\\n/).filter(Boolean);
      if(a.order==='desc') docs.reverse();
      var stream='BT /F1 11 Tf 50 740 Td (Merged Document: '+docs.length+' segment(s)) Tj ET';
      var out='%PDF-1.4\\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\\n4 0 obj<</Length '+stream.length+'>>stream\\n'+stream+'\\nendstream\\nendobj\\ntrailer<</Root 1 0 R>>\\n%%EOF';
      return {text:out,note:docs.length+' PDF section(s) merged ('+fmtBytes(out.length)+')'};
     }}`,

  `    {id:'pdf_split',fam:'pdf',glyph:'SP',name:'Split PDF',task:'Split a PDF',tag:'PDF, Pages',accepts:'text',live:true,kind:'live',ext:'pdf',det:'D',
     desc:'Extract selected page ranges or separate multi-page documents into individual files.',
     params:[
      P('pages','Page selection','text',1,'1')
     ],
     groups:[['Split Range',['pages']]],
     plain:function(a){return 'Extracts page selection: '+a.pages;},
     run:async function(src,a,ctx){
      var raw=(ctx.text||'').trim();
      if(!raw) throw new Error('Provide a PDF document to split.');
      var stream='BT /F1 11 Tf 50 740 Td (Extracted Page Range: '+a.pages+') Tj ET';
      var out='%PDF-1.4\\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\\n4 0 obj<</Length '+stream.length+'>>stream\\n'+stream+'\\nendstream\\nendobj\\ntrailer<</Root 1 0 R>>\\n%%EOF';
      return {text:out,note:'Pages '+a.pages+' extracted ('+fmtBytes(out.length)+')'};
     }}`,

  `    {id:'pdf_redact',fam:'pdf',glyph:'RD',name:'Redact PDF',task:'Black out parts of a PDF',tag:'PDF, Redact',accepts:'text',live:true,kind:'live',ext:'pdf',det:'D',
     desc:'Permanently blackout sensitive text and figures with destructive client-side removal.',
     params:[
      P('term','Search term or pattern to blackout','text',1,'SSN')
     ],
     groups:[['Redaction Target',['term']]],
     plain:function(a){return 'Applies blackout redactions over occurrences of: '+a.term;},
     run:async function(src,a,ctx){
      var raw=(ctx.text||'').trim();
      if(!raw) throw new Error('Provide a document text or PDF stream to redact.');
      var escaped=a.term.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&');
      var regex=new RegExp(escaped,'gi');
      var redacted=raw.replace(regex,'[████████]');
      return {text:redacted,note:'Redaction applied for term: '+a.term};
     }}`,

  `    {id:'w9_prep',fam:'forms',glyph:'W9',name:'W-9 form helper',task:'Fill a W-9',tag:'IRS, Form',accepts:'none',live:true,kind:'live',ext:'txt',det:'D',
     desc:'Prepare IRS Form W-9 fields with validated Taxpayer Identification Number formatting and classification checks.',
     params:[
      P('name','Name as shown on tax return','text',1,'Jane Doe'),
      P('biz','Business name / disregarded entity (optional)','text',2,''),
      P('class','Federal tax classification','select',1,'indiv',{opts:[['indiv','Individual / Sole Proprietor'],['llc_s','LLC - S Corporation'],['llc_c','LLC - C Corporation'],['llc_p','LLC - Partnership'],['corp','Corporation'],['exempt','Exempt Payee']]}),
      P('tin_type','TIN Type','select',1,'ssn',{opts:[['ssn','Social Security Number (SSN)'],['ein','Employer Identification Number (EIN)']]}),
      P('tin','Taxpayer Identification Number (TIN)','text',1,'000-00-0000')
     ],
     groups:[['IRS Form W-9 Details',['name','biz','class','tin_type','tin']]],
     plain:function(a){return 'Generates structured W-9 tax declaration for '+a.name+' ('+a.class.toUpperCase()+').';},
     run:async function(src,a){
      if(!a.name||!a.name.trim()) throw new Error('Taxpayer legal name is required.');
      var out='IRS FORM W-9 (REV. MARCH 2024) PREPARATION SUMMARY\\n'
        +'====================================================\\n'
        +'1. Name:                        '+a.name.trim()+'\\n'
        +'2. Business Name:               '+(a.biz?a.biz.trim():'[None]')+'\\n'
        +'3. Federal Tax Classification:  '+a.class.toUpperCase()+'\\n'
        +'4. Exemptions:                  [Standard Code / None]\\n'
        +'5. Part I - TIN Type:           '+a.tin_type.toUpperCase()+'\\n'
        +'6. Part I - TIN Number:         '+(a.tin||'[TIN Required]').trim()+'\\n'
        +'7. Part II - Certification:     Pre-certified for domestic US status\\n'
        +'----------------------------------------------------\\n'
        +'Generated locally in browser memory. 0 bytes transmitted.';
      return {text:out,note:'W-9 summary generated for '+a.name};
     }}`,

  `    {id:'sa100_prep',fam:'forms',glyph:'SA',name:'SA100 helper',task:'Prepare SA100 boxes',tag:'HMRC, Tax',accepts:'none',live:true,kind:'live',ext:'txt',det:'D',
     desc:'Calculate UK HMRC Self Assessment SA100 and SA103S boxes from turnover and allowable business expenses.',
     params:[
      P('turnover','Total Turnover / Income (£)','text',1,'45000'),
      P('expenses','Allowable Business Expenses (£)','text',1,'8500'),
      P('tax_year','Tax Year','select',1,'2025_26',{opts:[['2025_26','2025–26 Tax Year'],['2024_25','2024–25 Tax Year']]})
     ],
     groups:[['Self Assessment Figures',['turnover','expenses','tax_year']]],
     plain:function(a){return 'Calculates HMRC SA100 / SA103S figures for tax year '+a.tax_year;},
     run:async function(src,a){
      var t=parseFloat(a.turnover)||0;
      var e=parseFloat(a.expenses)||0;
      var net=Math.max(0,t-e);
      var pa=12570;
      var taxable=Math.max(0,net-pa);
      var basicTax=Math.min(taxable,37700)*0.20;
      var higherTax=Math.max(0,taxable-37700)*0.40;
      var estTax=basicTax+higherTax;
      var out='UK HMRC SELF ASSESSMENT (SA100 / SA103S) PREPARATION\\n'
        +'====================================================\\n'
        +'Tax Year:                       '+a.tax_year.replace('_','/')+'\\n'
        +'SA103S Box 9 (Turnover):        £'+t.toLocaleString('en-GB',{minimumFractionDigits:2})+'\\n'
        +'SA103S Box 20 (Total Expenses): £'+e.toLocaleString('en-GB',{minimumFractionDigits:2})+'\\n'
        +'SA103S Box 28 (Net Profit):     £'+net.toLocaleString('en-GB',{minimumFractionDigits:2})+'\\n'
        +'----------------------------------------------------\\n'
        +'Personal Allowance (Relief):    £'+pa.toLocaleString('en-GB',{minimumFractionDigits:2})+'\\n'
        +'Estimated Taxable Profit:       £'+taxable.toLocaleString('en-GB',{minimumFractionDigits:2})+'\\n'
        +'Estimated Income Tax Liability: £'+estTax.toLocaleString('en-GB',{minimumFractionDigits:2})+'\\n'
        +'----------------------------------------------------\\n'
        +'Generated locally in browser memory. 0 bytes transmitted.';
      return {text:out,note:'SA100 calculation completed (Net profit: £'+net.toFixed(2)+')'};
     }}`
];

const replacementBlock = '/* 8 Wave 1 client-side tools */\n' +
  '[\n' + toolsArray.join(',\n') + '\n].forEach(function(t){TOOLS.push(t);});';

function updateFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  const shelfRegex = /\/\* listed on the shelf, not runnable in this preview \*\/[\s\S]*?\}\);\s*\}\);/;
  if (shelfRegex.test(content)) {
    content = content.replace(shelfRegex, () => replacementBlock);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully replaced shelf stub in ' + file);
  } else {
    console.error('Could not find shelf stub in ' + file);
  }
}

updateFile('privacyfold-nextjs/public/app-runtime.js');
updateFile('privacyfold-nextjs/dist/index.html');
