import { decode } from "base64-arraybuffer";

import { supabase } from "../lib/supabase";

const AVATAR_BUCKET = "avatars";
const AVATAR_FILE_NAME = "avatar.jpg";

async function getAuthenticatedUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  return user.id;
}

function avatarPath(userId: string) {
  return `${userId}/${AVATAR_FILE_NAME}`;
}

export async function uploadAvatar(base64: string): Promise<string> {
  const userId = await getAuthenticatedUserId();
  const path = avatarPath(userId);

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, decode(base64), {
      cacheControl: "3600",
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(path);

  // Como sobrescrevemos sempre o mesmo arquivo, o parâmetro evita
  // que navegador/CDN mostre uma versão antiga em cache.
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function deleteAvatar(): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const path = avatarPath(userId);

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([path]);

  if (error) {
    throw error;
  }
}
