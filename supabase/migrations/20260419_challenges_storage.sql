-- Crear bucket para desafíos de empresa
INSERT INTO storage.buckets (id, name, public)
VALUES ('enterprise-challenges', 'enterprise-challenges', true)
ON CONFLICT (id) DO NOTHING;

-- Política de lectura pública
CREATE POLICY "challenges_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'enterprise-challenges');

-- Política de upload para empresas autenticadas
CREATE POLICY "challenges_enterprise_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'enterprise-challenges');

-- Política de update/delete para el dueño
CREATE POLICY "challenges_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'enterprise-challenges' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "challenges_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'enterprise-challenges' AND (storage.foldername(name))[1] = auth.uid()::text);
