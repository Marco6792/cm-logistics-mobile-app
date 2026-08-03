import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import Env from 'react-native-config';
import Config from '../../navigator.config';
import { navigatorConfig, config, toBoolean, get } from '../utils';
import useStorage from '../hooks/use-storage';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
    const [instanceLinkedFleetbaseHost, setInstanceLinkedFleetbaseHost] = useStorage('INSTANCE_LINK_FLEETBASE_HOST');
    const [instanceLinkedFleetbaseKey, setInstanceLinkedFleetbaseKey] = useStorage('INSTANCE_LINK_FLEETBASE_KEY');
    const [instanceLinkedSocketclusterHost, setInstanceLinkedSocketclusterHost] = useStorage('INSTANCE_LINK_SOCKETCLUSTER_HOST');
    const [instanceLinkedSocketclusterPort, setInstanceLinkedSocketclusterPort] = useStorage('INSTANCE_LINK_SOCKETCLUSTER_PORT');
    const [instanceLinkedSocketclusterSecure, setInstanceLinkedSocketclusterSecure] = useStorage('INSTANCE_LINK_SOCKETCLUSTER_SECURE');

    const setInstanceLinkConfig = useCallback(
        (key, value) => {
            switch (key) {
                case 'API_HOST':
                case 'FLEETBASE_HOST':
                    setInstanceLinkedFleetbaseHost(value);
                    break;
                case 'API_KEY':
                case 'FLEETBASE_KEY':
                    setInstanceLinkedFleetbaseKey(value);
                    break;
                case 'SC_HOST':
                case 'SOCKETCLUSTER_HOST':
                    setInstanceLinkedSocketclusterHost(value);
                    break;
                case 'SC_PORT':
                case 'SOCKETCLUSTER_PORT':
                    setInstanceLinkedSocketclusterPort(value);
                    break;
                case 'SC_SECURE':
                case 'SOCKETCLUSTER_SECURE':
                    setInstanceLinkedSocketclusterSecure(value);
                    break;
            }
        },
        [setInstanceLinkedFleetbaseHost, setInstanceLinkedFleetbaseKey, setInstanceLinkedSocketclusterHost, setInstanceLinkedSocketclusterPort, setInstanceLinkedSocketclusterSecure]
    );

    const getInstanceLinkConfig = useCallback(() => {
        return {
            FLEETBASE_HOST: instanceLinkedFleetbaseHost,
            FLEETBASE_KEY: instanceLinkedFleetbaseKey,
            SOCKETCLUSTER_HOST: instanceLinkedSocketclusterHost,
            SOCKETCLUSTER_PORT: instanceLinkedSocketclusterPort,
            SOCKETCLUSTER_SECURE: instanceLinkedSocketclusterSecure,
        };
    }, [instanceLinkedFleetbaseHost, instanceLinkedFleetbaseKey, instanceLinkedSocketclusterHost, instanceLinkedSocketclusterPort, instanceLinkedSocketclusterSecure]);

    const clearInstanceLinkConfig = useCallback(() => {
        setInstanceLinkedFleetbaseHost(undefined);
        setInstanceLinkedFleetbaseKey(undefined);
        setInstanceLinkedSocketclusterHost(undefined);
        setInstanceLinkedSocketclusterPort(undefined);
        setInstanceLinkedSocketclusterSecure(undefined);
    }, [setInstanceLinkedFleetbaseHost, setInstanceLinkedFleetbaseKey, setInstanceLinkedSocketclusterHost, setInstanceLinkedSocketclusterPort, setInstanceLinkedSocketclusterSecure]);

    const resolveConnectionConfig = useCallback(
        (key, defaultValue = null) => {
            const host = instanceLinkedFleetbaseHost && String(instanceLinkedFleetbaseHost).length > 0 ? instanceLinkedFleetbaseHost : config('FLEETBASE_HOST');
            const apiKey = instanceLinkedFleetbaseKey && String(instanceLinkedFleetbaseKey).length > 0 ? instanceLinkedFleetbaseKey : config('FLEETBASE_KEY');
            const socketHost = instanceLinkedSocketclusterHost && String(instanceLinkedSocketclusterHost).length > 0 ? instanceLinkedSocketclusterHost : config('SOCKETCLUSTER_HOST', 'socket.fleetbase.io');
            const socketPort = instanceLinkedSocketclusterPort && String(instanceLinkedSocketclusterPort).length > 0 ? instanceLinkedSocketclusterPort : config('SOCKETCLUSTER_PORT', '8000');
            const socketSecure = instanceLinkedSocketclusterSecure !== null && instanceLinkedSocketclusterSecure !== undefined ? instanceLinkedSocketclusterSecure : config('SOCKETCLUSTER_SECURE', true);

            const fullConfig = {
                FLEETBASE_HOST: host,
                FLEETBASE_KEY: apiKey,
                SOCKETCLUSTER_HOST: socketHost,
                SOCKETCLUSTER_PORT: parseInt(socketPort),
                SOCKETCLUSTER_SECURE: toBoolean(socketSecure),
                SOCKETCLUSTER_PATH: config('SOCKETCLUSTER_PATH', '/socketcluster/'),
            };

            return get(fullConfig, key, defaultValue);
        },
        [instanceLinkedFleetbaseHost, instanceLinkedFleetbaseKey, instanceLinkedSocketclusterHost, instanceLinkedSocketclusterPort, instanceLinkedSocketclusterSecure]
    );

    const value = useMemo(() => {
        return {
            ...Config,
            ...Env,
            navigatorConfig,
            config,
            instanceLinkConfig: getInstanceLinkConfig(),
            getInstanceLinkConfig,
            resolveConnectionConfig,
            setInstanceLinkedFleetbaseHost,
            setInstanceLinkedFleetbaseKey,
            setInstanceLinkedSocketclusterHost,
            setInstanceLinkedSocketclusterPort,
            setInstanceLinkedSocketclusterSecure,
            setInstanceLinkConfig,
            clearInstanceLinkConfig,
        };
    }, [
        getInstanceLinkConfig,
        resolveConnectionConfig,
        setInstanceLinkedFleetbaseHost,
        setInstanceLinkedFleetbaseKey,
        setInstanceLinkedSocketclusterHost,
        setInstanceLinkedSocketclusterPort,
        setInstanceLinkedSocketclusterSecure,
        setInstanceLinkConfig,
        clearInstanceLinkConfig,
        // Instance link config values
        instanceLinkedFleetbaseHost,
        instanceLinkedFleetbaseKey,
        instanceLinkedSocketclusterHost,
        instanceLinkedSocketclusterPort,
        instanceLinkedSocketclusterSecure,
    ]);

    return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = (): ConfigContextValue => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};
