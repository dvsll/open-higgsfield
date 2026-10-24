export const importTypes:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',mp4:'video/mp4',webm:'video/webm',mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',flac:'audio/flac',ogg:'audio/ogg'};
export function importType(file:{name:string;size:number}):string{
 const type=importTypes[file.name.split('.').at(-1)?.toLowerCase()||''];
 if(!type)throw Error('Use PNG, JPG, WebP, MP4, WebM, MP3, WAV, M4A, FLAC or Ogg.');
 if(!file.size)throw Error('This file is empty.');
 if(file.size>(type.startsWith('image/')?20:100)*1024*1024)throw Error(type.startsWith('image/')?'Choose an image under 20 MB.':'Choose audio or video under 100 MB.');
 return type;
}
export function externalFiles(data:{types:readonly string[]}|null):boolean{return !!data?.types.includes('Files')&&!data.types.includes('application/x-studio-file')}
