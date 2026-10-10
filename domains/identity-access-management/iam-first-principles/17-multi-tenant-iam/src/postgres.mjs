export async function readDocument(db,userId,organizationId,documentId){
 // Authentication resolved userId before this query; route supplied organizationId is untrusted.
 const {rows}=await db.query(`SELECT d.id,d.title FROM documents d
 JOIN memberships m ON m.organization_id=d.organization_id AND m.user_id=$1
 JOIN users u ON u.id=m.user_id
 WHERE d.organization_id=$2 AND d.id=$3 AND u.active AND m.active
 AND m.role IN ('viewer','editor','admin','owner')`,[userId,organizationId,documentId]);
 return rows[0]??null;
}
export async function assignRole(db,actor,target,organization,role){
 if(!['viewer','editor','admin'].includes(role)||actor===target)throw new Error('invalid assignment');
 await db.query('BEGIN');
 try{
 // Lock every authority row used by the decision. Concurrent suspension/revocation must serialize.
 const {rows}=await db.query(`SELECT m.role FROM memberships m JOIN users u ON u.id=m.user_id
 WHERE m.organization_id=$1 AND m.user_id=$2 AND m.active AND u.active FOR UPDATE OF m,u`,[organization,actor]);
 if(rows[0]?.role!=='owner')throw new Error('forbidden');
 const result=await db.query(`UPDATE memberships SET role=$1,version=version+1 WHERE organization_id=$2 AND user_id=$3 AND active`,[role,organization,target]);
 if(result.rowCount!==1)throw new Error('target unavailable');await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e;}
}
