# Berugram A.G.C.B. Vidyapith – Full Website + Admin CMS

## Start the website

1. Open this folder in VS Code.
2. Open Terminal in the `backend` folder.
3. Run:

```bash
npm install
npm start
```

4. Open the public website:

`http://localhost:3000`

5. Admin login:

`http://localhost:3000/admin/`

### First login

- Username: `admin`
- Password: `Headmaster@123`

The first server start automatically creates `backend/admin.json` with a secure password hash. **Do not delete that file after changing the password.**

## What can be managed from Admin

- Home hero slides: JPG/PNG upload + title/subtitle/description
- Home statistics
- Notice ticker
- About School text and image
- TIC/Headmaster name, role, qualification, message and photo
- Academic programmes and subjects
- Facilities
- Teachers & Staff: name, faculty/subject, qualification, group and photo; add/delete
- Notices: upload PDF, title, description and date; add/delete
- Events & Activities
- Gallery: upload images, category and caption; add/delete
- Media Library: view uploaded files and delete unused files
- School contact/settings/footer
- Admin username and password
- Full JSON backup/restore for emergency use

## Important

After uploading an image/PDF, the admin panel automatically places its file path into the selected item. You do not need to copy JSON paths manually.
