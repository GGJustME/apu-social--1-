--
-- SEED DATA (PHASE 1A)
--

-- Initial Platform Settings
INSERT INTO platform_settings (key, value) VALUES
('storage_limits', '{
    "max_file_size_mb": 50,
    "max_user_storage_mb": 200,
    "max_total_storage_gb": 1
}'),
('system_status', '{
    "is_maintenance": false,
    "max_active_users": 20
}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
