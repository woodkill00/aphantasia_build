/* Local image header preflight. A successful header is not permission to upload or display. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.ImageryImageFile=factory();}(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MAX_BYTES=8388608,MAX_DIMENSION=4096,MAX_PIXELS=8388608;
 function inspect(bytes){
  if(!bytes||Object.getPrototypeOf(bytes)!==Uint8Array.prototype||['length','byteLength','byteOffset','buffer','slice'].some(key=>Object.hasOwn(bytes,key)))throw Error('Image bytes must be an ordinary Uint8Array without overridden fields.');
  const typed=Object.getPrototypeOf(Uint8Array.prototype),length=Object.getOwnPropertyDescriptor(typed,'length').get.call(bytes),offset=Object.getOwnPropertyDescriptor(typed,'byteOffset').get.call(bytes),buffer=Object.getOwnPropertyDescriptor(typed,'buffer').get.call(bytes);
  if(Object.getPrototypeOf(buffer)!==ArrayBuffer.prototype||length<24||length>MAX_BYTES)throw Error('Choose a PNG or JPEG image no larger than 8 MiB.');
  const v=new DataView(buffer,offset,length),word=p=>String.fromCharCode(v.getUint8(p),v.getUint8(p+1),v.getUint8(p+2),v.getUint8(p+3));let width,height,type;
  if([137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x)){
   type='image/png';if(v.getUint32(8)!==13||word(12)!=='IHDR')throw Error('Invalid PNG header.');
   width=v.getUint32(16);height=v.getUint32(20);let p=8,seenData=false;
   while(p+12<=length){const n=v.getUint32(p),kind=word(p+4);if(n>length-p-12)throw Error('Truncated PNG chunk.');if(kind==='acTL')throw Error('Animated PNG is not supported. Choose a still image.');if(kind==='IDAT')seenData=true;p+=n+12;if(kind==='IEND')break;}
   if(!seenData)throw Error('PNG pixel data is missing.');
  }else if(bytes[0]===255&&bytes[1]===216){
   type='image/jpeg';let p=2;
   while(p<length){if(bytes[p++]!==255)throw Error('Invalid JPEG marker.');while(p<length&&bytes[p]===255)p++;const marker=bytes[p++];if(marker===217||marker===218)break;if(marker===1||(marker>=208&&marker<=215))continue;if(p+2>length)throw Error('Truncated JPEG segment.');const n=v.getUint16(p);if(n<2||p+n>length)throw Error('Truncated JPEG segment.');if([192,193,194].includes(marker)){if(n<8)throw Error('Invalid JPEG frame.');height=v.getUint16(p+3);width=v.getUint16(p+5);break;}p+=n;}
  }else throw Error('Only PNG and JPEG still-image files are supported. SVG, GIF and other formats are not decoded.');
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>MAX_DIMENSION||height>MAX_DIMENSION||width*height>MAX_PIXELS)throw Error('Image dimensions must be at most 4096 per side and 8,388,608 pixels total.');
  return Object.freeze({type,width,height});
 }
 return Object.freeze({MAX_BYTES,MAX_DIMENSION,MAX_PIXELS,inspect});
}));
