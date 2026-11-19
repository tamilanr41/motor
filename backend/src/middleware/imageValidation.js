import { open, unlink } from 'node:fs/promises';
import { HttpError } from '../utils/http.js';

function matchesImageSignature(buffer,mime) {
  if(mime==='image/jpeg') return buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff;
  if(mime==='image/png') return buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if(mime==='image/webp') return buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP';
  return false;
}

export async function verifyImageUploads(req,_res,next) {
  const files=[...(req.files||[]),...(req.file?[req.file]:[])];
  try {
    for(const file of files){
      const handle=await open(file.path,'r');const bytes=Buffer.alloc(12);
      try{await handle.read(bytes,0,12,0);}finally{await handle.close();}
      if(!matchesImageSignature(bytes,file.mimetype)){await unlink(file.path).catch(()=>{});throw new HttpError(400,'The uploaded file is not a valid JPG, PNG or WebP image.');}
    }
    next();
  }catch(err){next(err);}
}
