import { useState, useMemo } from 'react';

// Mock data for theme injections library
const mockScenarios = [
  {
    id: 'scenario-1',
    content: 'A team member consistently arrives late to meetings',
    tags: ['conflict', 'teamwork', 'punctuality'],
    children: [
      {
        id: 'scenario-1a',
        content: 'The manager publicly calls out the behavior',
        tags: ['conflict', 'leadership', 'public-feedback'],
        children: [
          {
            id: 'scenario-1a-1',
            content: 'The team member becomes defensive',
            tags: ['conflict', 'defensiveness', 'reaction']
          },
          {
            id: 'scenario-1a-2',
            content: 'Other team members feel uncomfortable',
            tags: ['conflict', 'team-dynamics', 'atmosphere']
          },
          {
            id: 'scenario-1a-3',
            content: 'The manager realizes the approach was wrong',
            tags: ['conflict', 'leadership', 'self-awareness']
          }
        ]
      },
      {
        id: 'scenario-1b',
        content: 'Other team members start arriving late too',
        tags: ['conflict', 'peer-influence', 'team-culture']
      },
      {
        id: 'scenario-1c',
        content: 'The late team member has valid excuses',
        tags: ['conflict', 'understanding', 'flexibility']
      },
      {
        id: 'scenario-1d',
        content: 'The team implements a new attendance policy',
        tags: ['conflict', 'policy', 'structure']
      },
      {
        id: 'scenario-1e',
        content: 'The late team member is a high performer',
        tags: ['conflict', 'performance', 'balance']
      }
    ]
  },
  {
    id: 'scenario-2',
    content: 'A software bug is discovered in production',
    tags: ['technology', 'crisis', 'quality'],
    children: [
      {
        id: 'scenario-2a',
        content: 'The fix requires a system restart',
        tags: ['technology', 'downtime', 'user-impact']
      },
      {
        id: 'scenario-2b',
        content: 'Users are actively using the system',
        tags: ['technology', 'user-experience', 'timing']
      },
      {
        id: 'scenario-2c',
        content: 'The bug affects critical functionality',
        tags: ['technology', 'critical', 'priority']
      },
      {
        id: 'scenario-2d',
        content: 'The development team is unavailable',
        tags: ['technology', 'availability', 'escalation']
      },
      {
        id: 'scenario-2e',
        content: 'The bug was introduced in recent deployment',
        tags: ['technology', 'deployment', 'rollback']
      }
    ]
  },
  {
    id: 'scenario-3',
    content: 'A project deadline is approaching rapidly',
    tags: ['deadline', 'pressure', 'quality'],
    children: [
      {
        id: 'scenario-3a',
        content: 'The team considers cutting corners',
        tags: ['deadline', 'quality', 'ethics']
      },
      {
        id: 'scenario-3b',
        content: 'Quality standards are being questioned',
        tags: ['deadline', 'quality', 'standards']
      },
      {
        id: 'scenario-3c',
        content: 'Stakeholders are pushing for delivery',
        tags: ['deadline', 'stakeholders', 'pressure']
      },
      {
        id: 'scenario-3d',
        content: 'The team needs additional resources',
        tags: ['deadline', 'resources', 'escalation']
      },
      {
        id: 'scenario-3e',
        content: 'Scope creep has affected the timeline',
        tags: ['deadline', 'scope', 'management']
      }
    ]
  },
  {
    id: 'scenario-4',
    content: 'Personal data is accidentally exposed',
    tags: ['privacy', 'crisis', 'compliance'],
    children: [
      {
        id: 'scenario-4a',
        content: 'The breach affects thousands of users',
        tags: ['privacy', 'scale', 'impact']
      },
      {
        id: 'scenario-4b',
        content: 'Legal compliance is at risk',
        tags: ['privacy', 'legal', 'compliance']
      },
      {
        id: 'scenario-4c',
        content: 'The incident is reported to authorities',
        tags: ['privacy', 'reporting', 'authorities']
      },
      {
        id: 'scenario-4d',
        content: 'Public relations team is notified',
        tags: ['privacy', 'public-relations', 'communication']
      },
      {
        id: 'scenario-4e',
        content: 'Internal investigation begins immediately',
        tags: ['privacy', 'investigation', 'response']
      }
    ]
  },
  {
    id: 'scenario-5',
    content: 'A client threatens to cancel a major contract',
    tags: ['client', 'business', 'crisis'],
    children: [
      {
        id: 'scenario-5a',
        content: 'The client is unhappy with deliverables',
        tags: ['client', 'deliverables', 'satisfaction']
      },
      {
        id: 'scenario-5b',
        content: 'The project is behind schedule',
        tags: ['client', 'schedule', 'timeline']
      },
      {
        id: 'scenario-5c',
        content: 'Communication has broken down',
        tags: ['client', 'communication', 'relationship']
      },
      {
        id: 'scenario-5d',
        content: 'The client wants to renegotiate terms',
        tags: ['client', 'negotiation', 'contract']
      },
      {
        id: 'scenario-5e',
        content: 'Senior management needs to get involved',
        tags: ['client', 'escalation', 'management']
      }
    ]
  },
  {
    id: 'scenario-6',
    content: 'A team member is consistently underperforming',
    tags: ['performance', 'management', 'teamwork'],
    children: [
      {
        id: 'scenario-6a',
        content: 'The team member is unaware of expectations',
        tags: ['performance', 'expectations', 'communication']
      },
      {
        id: 'scenario-6b',
        content: 'Performance reviews are overdue',
        tags: ['performance', 'reviews', 'feedback']
      },
      {
        id: 'scenario-6c',
        content: 'Other team members are picking up slack',
        tags: ['performance', 'teamwork', 'burden']
      },
      {
        id: 'scenario-6d',
        content: 'The team member has personal issues',
        tags: ['performance', 'personal', 'support']
      },
      {
        id: 'scenario-6e',
        content: 'Training opportunities are available',
        tags: ['performance', 'training', 'development']
      }
    ]
  }
];

export const useThemeInjections = () => {
  const [selectedTag, setSelectedTag] = useState('all');
  const [expandedScenarios, setExpandedScenarios] = useState(new Set());
  const [showTags, setShowTags] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  // Helper functions for theme injections library
  const availableTags = useMemo(() => {
    const allTags = new Set();
    mockScenarios.forEach(scenario => {
      scenario.tags.forEach(tag => allTags.add(tag));
      scenario.children?.forEach(child => {
        child.tags.forEach(tag => allTags.add(tag));
      });
    });
    return Array.from(allTags).sort();
  }, []);

  const filteredTags = useMemo(() => {
    if (!tagSearchQuery) return availableTags;
    return availableTags.filter(tag => 
      tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
    );
  }, [availableTags, tagSearchQuery]);

  const filteredScenarios = useMemo(() => {
    if (selectedTag === 'all') return mockScenarios;
    return mockScenarios.filter(scenario => 
      scenario.tags.includes(selectedTag) || 
      scenario.children?.some(child => child.tags.includes(selectedTag))
    );
  }, [selectedTag]);

  const toggleScenario = (scenarioId) => {
    setExpandedScenarios(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scenarioId)) {
        newSet.delete(scenarioId);
      } else {
        newSet.add(scenarioId);
      }
      return newSet;
    });
  };

  const resetTagSearch = () => {
    setTagSearchQuery('');
  };

  const resetTagSelection = () => {
    setSelectedTag('all');
  };

  return {
    mockScenarios,
    selectedTag,
    expandedScenarios,
    showTags,
    tagSearchQuery,
    availableTags,
    filteredTags,
    filteredScenarios,
    setSelectedTag,
    setTagSearchQuery,
    setShowTags,
    toggleScenario,
    resetTagSearch,
    resetTagSelection
  };
};
