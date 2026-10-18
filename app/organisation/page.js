// app/organisation/page.js - leitet auf den ersten Untertab weiter
import { redirect } from 'next/navigation';

export default function OrganisationIndex() {
  redirect('/organisation/material');
}
