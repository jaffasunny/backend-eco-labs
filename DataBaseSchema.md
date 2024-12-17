UsersTable => {
id:string;
name:string;
email:string (Unique);
password:string;
role:Admin | Landowner | Researcher;
phone: string;
university:string;
professor_name:string;
createdAt:timestamp;
updatedAt:timestamp;
}

PropertiesTable => {
id:string;
name:string;
address:string;
landowner_id:string (Foreign Key Users.id);
status:Active | Pending | Archived;
assessment_report: string;
createdAt:timestamp;
updatedAt:timestamp;
}

ResearchTable => {
id:string;
researcher_id:string(Foreign Key Users.id);
property_id:string(Foreign Key Properties.id);
proposal_details:string;
status:Pending | Approbed | Rejected;
createdAt:timestamp;
updatedAt:timestamp;
}

AnnualReportsTable => {
id:string;
researcher_id:string (Foreign Key Users.id);
property_id:string (Foreign Key Properties.id);
report_details:string;
attachments:string[];
createdAt:timestamp;
updatedAt:timestamp;
}

DocumentsTable => {
id:string (PK);
user_id:string (foreign key Users.id);
document_type:FundingGrant | LiabilityWaiver;
document_url:string;
signed_status:boolean;
createdAt:timestamp;
updatedAt:timestamp;
}
