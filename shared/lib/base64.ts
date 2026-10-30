/** Validate large embedded assets without a whole-string repeating regex. */
export function validBase64(value:unknown):value is string{
 return typeof value==='string'&&value.length>0&&value.length%4===0&&!/[^A-Za-z0-9+/]/.test(value.replace(/={1,2}$/, ''));
}
