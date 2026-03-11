import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema({
    logoLight: String,
    logoDark: String,
    loginBackground: String,
});

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
export default SiteSettings;
